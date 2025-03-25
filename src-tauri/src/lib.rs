use std::collections::HashMap;
use std::iter;
use std::sync::Arc;
use std::time::{Duration, SystemTime, UNIX_EPOCH};

use arrow::array::{RecordBatch, StringArray};
use arrow::compute;
use arrow::datatypes::{ArrowPrimitiveType, DataType, Field, Schema};
use arrow_flight::flight_service_client::FlightServiceClient;
use arrow_flight::Action;
use arrow_json::ArrayWriter;
use datafusion::parquet::arrow::ParquetRecordBatchStreamBuilder;
use datafusion::physical_plan::common;
use futures_util::stream::FuturesUnordered;
use futures_util::{StreamExt, TryStreamExt};
use modelardb_embedded::modelardb::client::{Client, Node};
use modelardb_embedded::modelardb::ModelarDB;
use modelardb_embedded::TableType;
use modelardb_types::types::{ArrowTimestamp, ArrowValue, ErrorBound, TimestampBuilder};
use object_store::aws::{AmazonS3, AmazonS3Builder};
use object_store::path::Path;
use object_store::ObjectStore;
use serde::Serialize;
use tauri::{AppHandle, Emitter, Manager, State};
use tokio::sync::Mutex;
use tokio::task::JoinHandle;
use tokio::time;
use url::Url;

struct AppState {
    ingestion_tasks: HashMap<String, JoinHandle<()>>,
    flush_task: Option<JoinHandle<()>>,
    monitor_remote_object_store_task: Option<JoinHandle<()>>,
    modelardb_remote_object_store: AmazonS3,
    parquet_remote_object_store: AmazonS3,
}

impl AppState {
    fn new() -> Self {
        let modelardb_remote_object_store = build_s3_object_store("modelardb".to_owned());
        let parquet_remote_object_store = build_s3_object_store("parquet".to_owned());

        Self {
            ingestion_tasks: HashMap::new(),
            flush_task: None,
            monitor_remote_object_store_task: None,
            modelardb_remote_object_store,
            parquet_remote_object_store,
        }
    }
}

fn build_s3_object_store(bucket_name: String) -> AmazonS3 {
    let location = format!("s3://{bucket_name}");

    let storage_options = HashMap::from([
        ("aws_access_key_id".to_owned(), "minioadmin".to_owned()),
        ("aws_secret_access_key".to_owned(), "minioadmin".to_owned()),
        (
            "aws_endpoint_url".to_owned(),
            "http://127.0.0.1:9000".to_owned(),
        ),
        ("aws_bucket_name".to_owned(), bucket_name),
        ("aws_s3_allow_unsafe_rename".to_owned(), "true".to_owned()),
    ]);

    let url = Url::parse(&location).unwrap();

    // Build the Amazon S3 object store with the given storage options manually to allow http.
    storage_options
        .iter()
        .fold(
            AmazonS3Builder::new()
                .with_url(url.to_string())
                .with_allow_http(true),
            |builder, (key, value)| match key.parse() {
                Ok(k) => builder.with_config(k, value),
                Err(_) => builder,
            },
        )
        .build()
        .unwrap()
}

#[tauri::command]
async fn create_tables() {
    let modelardb_manager_node = Node::Manager("grpc://127.0.0.1:9998".to_owned());
    let mut modelardb_client = Client::connect(modelardb_manager_node).await.unwrap();

    let table_schema = table_schema();

    let lossless_table_type =
        TableType::ModelTable(table_schema.clone(), HashMap::new(), HashMap::new());

    let field_column_names = vec![
        "wind speed",
        "pitch angle",
        "rotor speed",
        "active power",
        "cos_nacelle_dir",
        "sin_nacelle_dir",
        "cos_wind_dir",
        "sin_wind_dir",
        "cor. nacelle direction",
        "cor. wind direction",
    ];

    let five_error_bounds: HashMap<String, ErrorBound> = field_column_names
        .clone()
        .into_iter()
        .map(|name| (name.to_owned(), ErrorBound::try_new_absolute(5.0).unwrap()))
        .collect();

    let fifteen_error_bounds: HashMap<String, ErrorBound> = field_column_names
        .into_iter()
        .map(|name| (name.to_owned(), ErrorBound::try_new_absolute(15.0).unwrap()))
        .collect();

    let five_error_bound_table_type =
        TableType::ModelTable(table_schema.clone(), five_error_bounds, HashMap::new());

    let fifteen_error_bound_table_type =
        TableType::ModelTable(table_schema.clone(), fifteen_error_bounds, HashMap::new());

    modelardb_client
        .create("wind_1", lossless_table_type)
        .await
        .unwrap();
    modelardb_client
        .create("wind_2", five_error_bound_table_type)
        .await
        .unwrap();
    modelardb_client
        .create("wind_3", fifteen_error_bound_table_type)
        .await
        .unwrap();

    let parquet_manager_node = Node::Manager("grpc://127.0.0.1:9970".to_owned());
    let mut parquet_client = Client::connect(parquet_manager_node).await.unwrap();

    let table_type = TableType::NormalTable(table_schema.clone());

    parquet_client
        .create("wind_1", table_type.clone())
        .await
        .unwrap();
    parquet_client
        .create("wind_2", table_type.clone())
        .await
        .unwrap();
    parquet_client.create("wind_3", table_type).await.unwrap();
}

#[tauri::command]
async fn ingest_into_table(
    state: State<'_, Mutex<AppState>>,
    table_name: String,
    count: usize,
) -> Result<(), String> {
    let mut state = state.lock().await;

    if let Some(handle) = &state.ingestion_tasks.get(&table_name) {
        handle.abort();
    }

    let join_handle = tokio::spawn(ingest_into_table_task(table_name.clone(), count));
    state.ingestion_tasks.insert(table_name, join_handle);

    Ok(())
}

async fn ingest_into_table_task(table_name: String, count: usize) {
    let file = tokio::fs::File::open("../data/wind.parquet").await.unwrap();
    let builder = ParquetRecordBatchStreamBuilder::new(file).await.unwrap();

    let stream = builder.build().unwrap();
    let record_batches = stream.try_collect::<Vec<_>>().await.unwrap();
    let record_batch =
        compute::concat_batches(&record_batches[0].schema(), &record_batches).unwrap();

    let edge_nodes = edge_nodes();

    let mut offset = 0;

    loop {
        let mut futures: FuturesUnordered<_> = edge_nodes
            .iter()
            .enumerate()
            .map(|(index, (modelardb_node, parquet_node))| {
                ingest_data_points_into_nodes(
                    modelardb_node.clone(),
                    parquet_node.clone(),
                    index,
                    &table_name,
                    record_batch.slice((40000 * index) + offset, count),
                )
            })
            .collect();

        while let Some(()) = futures.next().await {}

        offset += count;

        if offset + count > 40000 {
            offset = 0;
        }

        time::sleep(Duration::from_secs(1)).await;
    }
}

async fn ingest_data_points_into_nodes(
    modelardb_node: Node,
    parquet_node: Node,
    node_id: usize,
    table_name: &str,
    data_points: RecordBatch,
) {
    let mut modelardb_client = Client::connect(modelardb_node).await.unwrap();
    let mut parquet_client = Client::connect(parquet_node).await.unwrap();

    let mut timestamps = TimestampBuilder::with_capacity(data_points.num_rows());

    let start = SystemTime::now();
    let since_the_epoch = start.duration_since(UNIX_EPOCH).unwrap();

    let mut next_timestamp: i64 = since_the_epoch.as_micros() as i64;
    let step = (Duration::from_secs(2).as_micros() as i64) / (data_points.num_rows() as i64);

    for _ in 0..data_points.num_rows() {
        timestamps.append_value(next_timestamp);
        next_timestamp += step;
    }

    let park_id = if node_id < 5 { "park_1" } else { "park_2" };
    let windmill_id = format!("windmill_{}", node_id + 1);

    let park_id_array: StringArray = iter::repeat(Some(park_id))
        .take(data_points.num_rows())
        .collect();

    let windmill_id_array: StringArray = iter::repeat(Some(&windmill_id))
        .take(data_points.num_rows())
        .collect();

    let record_batch = RecordBatch::try_new(
        Arc::new(table_schema()),
        vec![
            Arc::new(timestamps.finish()),
            Arc::new(park_id_array),
            Arc::new(windmill_id_array),
            data_points.column(1).clone(),
            data_points.column(2).clone(),
            data_points.column(3).clone(),
            data_points.column(4).clone(),
            data_points.column(5).clone(),
            data_points.column(6).clone(),
            data_points.column(7).clone(),
            data_points.column(8).clone(),
            data_points.column(9).clone(),
            data_points.column(10).clone(),
        ],
    )
    .unwrap();

    modelardb_client
        .write(table_name, record_batch.clone())
        .await
        .unwrap();
    parquet_client
        .write(table_name, record_batch)
        .await
        .unwrap();
}

fn table_schema() -> Schema {
    Schema::new(vec![
        Field::new("datetime", ArrowTimestamp::DATA_TYPE, false),
        Field::new("park_id", DataType::Utf8, false),
        Field::new("windmill_id", DataType::Utf8, false),
        Field::new("wind speed", ArrowValue::DATA_TYPE, false),
        Field::new("pitch angle", ArrowValue::DATA_TYPE, false),
        Field::new("rotor speed", ArrowValue::DATA_TYPE, false),
        Field::new("active power", ArrowValue::DATA_TYPE, false),
        Field::new("cos_nacelle_dir", ArrowValue::DATA_TYPE, false),
        Field::new("sin_nacelle_dir", ArrowValue::DATA_TYPE, false),
        Field::new("cos_wind_dir", ArrowValue::DATA_TYPE, false),
        Field::new("sin_wind_dir", ArrowValue::DATA_TYPE, false),
        Field::new("cor. nacelle direction", ArrowValue::DATA_TYPE, false),
        Field::new("cor. wind direction", ArrowValue::DATA_TYPE, false),
    ])
}

#[tauri::command]
async fn flush_nodes(
    state: State<'_, Mutex<AppState>>,
    interval_seconds: u64,
) -> Result<(), String> {
    let mut state = state.lock().await;

    if let Some(handle) = &state.flush_task {
        handle.abort();
    }

    let join_handle = tokio::spawn(flush_nodes_task(interval_seconds));
    state.flush_task = Some(join_handle);

    Ok(())
}

async fn flush_nodes_task(interval_seconds: u64) {
    let edge_nodes = edge_nodes();

    loop {
        for (modelardb_node, parquet_node) in &edge_nodes {
            tokio::spawn(flush_node(modelardb_node.clone()));
            tokio::spawn(flush_node(parquet_node.clone()));

            time::sleep(Duration::from_secs(interval_seconds / 10)).await;
        }
    }
}

async fn flush_node(node: Node) {
    let mut flight_client = FlightServiceClient::connect(node.url().to_owned())
        .await
        .unwrap();

    let action = Action {
        r#type: "FlushNode".to_owned(),
        body: vec![].into(),
    };

    flight_client.do_action(action).await.unwrap();
}

fn edge_nodes() -> Vec<(Node, Node)> {
    vec![
        (
            Node::Server("grpc://127.0.0.1:9981".to_owned()),
            Node::Server("grpc://127.0.0.1:9971".to_owned()),
        ),
        (
            Node::Server("grpc://127.0.0.1:9982".to_owned()),
            Node::Server("grpc://127.0.0.1:9972".to_owned()),
        ),
        (
            Node::Server("grpc://127.0.0.1:9983".to_owned()),
            Node::Server("grpc://127.0.0.1:9973".to_owned()),
        ),
        (
            Node::Server("grpc://127.0.0.1:9984".to_owned()),
            Node::Server("grpc://127.0.0.1:9974".to_owned()),
        ),
        (
            Node::Server("grpc://127.0.0.1:9985".to_owned()),
            Node::Server("grpc://127.0.0.1:9975".to_owned()),
        ),
        (
            Node::Server("grpc://127.0.0.1:9986".to_owned()),
            Node::Server("grpc://127.0.0.1:9976".to_owned()),
        ),
        (
            Node::Server("grpc://127.0.0.1:9987".to_owned()),
            Node::Server("grpc://127.0.0.1:9977".to_owned()),
        ),
        (
            Node::Server("grpc://127.0.0.1:9988".to_owned()),
            Node::Server("grpc://127.0.0.1:9978".to_owned()),
        ),
        (
            Node::Server("grpc://127.0.0.1:9989".to_owned()),
            Node::Server("grpc://127.0.0.1:9979".to_owned()),
        ),
        (
            Node::Server("grpc://127.0.0.1:9990".to_owned()),
            Node::Server("grpc://127.0.0.1:9980".to_owned()),
        ),
    ]
}

#[tauri::command]
async fn monitor_remote_object_stores(
    app: AppHandle,
    state: State<'_, Mutex<AppState>>,
    interval_seconds: u64,
) -> Result<(), String> {
    let mut state = state.lock().await;

    if let Some(handle) = &state.monitor_remote_object_store_task {
        handle.abort();
    }

    let join_handle = tokio::spawn(monitor_remote_object_stores_task(
        app,
        state.modelardb_remote_object_store.clone(),
        state.parquet_remote_object_store.clone(),
        interval_seconds,
    ));

    state.monitor_remote_object_store_task = Some(join_handle);

    Ok(())
}

async fn monitor_remote_object_stores_task(
    app: AppHandle,
    modelardb_remote_object_store: AmazonS3,
    parquet_remote_object_store: AmazonS3,
    interval_seconds: u64,
) {
    loop {
        tokio::spawn(emit_remote_object_store_table_size(
            app.clone(),
            modelardb_remote_object_store.clone(),
            "modelardb".to_owned(),
        ));

        tokio::spawn(emit_remote_object_store_table_size(
            app.clone(),
            parquet_remote_object_store.clone(),
            "parquet".to_owned(),
        ));

        time::sleep(Duration::from_secs(interval_seconds)).await;
    }
}

#[derive(Clone, Serialize)]
struct RemoteObjectStoreTableSize {
    node_type: String,
    wind_1_size: u64,
    wind_2_size: u64,
    wind_3_size: u64,
}

async fn emit_remote_object_store_table_size(
    app: AppHandle,
    object_store: AmazonS3,
    node_type: String,
) {
    let wind_1_table_size = table_size(&object_store, "wind_1").await;
    let wind_2_table_size = table_size(&object_store, "wind_2").await;
    let wind_3_table_size = table_size(&object_store, "wind_3").await;

    app.emit(
        "remote-object-store-size",
        RemoteObjectStoreTableSize {
            node_type: node_type.clone(),
            wind_1_size: wind_1_table_size,
            wind_2_size: wind_2_table_size,
            wind_3_size: wind_3_table_size,
        },
    )
    .unwrap();
}

async fn table_size(object_store: &AmazonS3, table_name: &str) -> u64 {
    let table_path = Path::from(format!("tables/{}", table_name));
    let table_files = object_store
        .list(Some(&table_path))
        .collect::<Vec<_>>()
        .await;

    table_files
        .into_iter()
        .map(|file| file.unwrap().size)
        .sum::<u64>()
}

#[derive(serde::Serialize)]
struct ClientTableResponse {
    name: String,
    columns: Vec<ColumnResponse>,
}

#[derive(serde::Serialize)]
struct ColumnResponse {
    name: String,
    data_type: String,
}

#[tauri::command]
async fn client_tables(url: String) -> Vec<ClientTableResponse> {
    let node = Node::Server(url);
    let mut client = Client::connect(node).await.unwrap();

    let table_names = client.tables().await.unwrap();

    let mut tables = vec![];
    for table_name in table_names {
        let schema = client.schema(&table_name).await.unwrap();

        let mut columns = vec![];
        for field in schema.fields() {
            columns.push(ColumnResponse {
                name: field.name().to_owned(),
                data_type: field.data_type().to_string(),
            });
        }

        tables.push(ClientTableResponse {
            name: table_name.to_owned(),
            columns,
        });
    }

    tables
}

#[tauri::command]
async fn client_query(url: String, query: String) -> Vec<u8> {
    let node = Node::Server(url);
    let mut client = Client::connect(node).await.unwrap();

    let record_batch_stream = client.read(&query).await.unwrap();
    let record_batches = common::collect(record_batch_stream).await.unwrap();
    let record_batch_slice: Vec<&RecordBatch> = record_batches.iter().collect();

    // Write the record batch out as a JSON array.
    let buf = Vec::new();

    let mut writer = ArrayWriter::new(buf);
    writer.write_batches(&record_batch_slice).unwrap();
    writer.finish().unwrap();

    writer.into_inner()
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .setup(|app| {
            app.manage(Mutex::new(AppState::new()));
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            create_tables,
            ingest_into_table,
            flush_nodes,
            monitor_remote_object_stores,
            client_tables,
            client_query
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
