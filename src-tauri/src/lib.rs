use std::collections::HashMap;
use std::process::Command;
use std::sync::Arc;
use std::time::{Duration, SystemTime, UNIX_EPOCH};
use std::{fs, iter};

use arrow::array::{RecordBatch, StringArray};
use arrow::compute;
use arrow::datatypes::{ArrowPrimitiveType, DataType, Field, Schema};
use arrow_flight::flight_service_client::FlightServiceClient;
use arrow_flight::{Action, Ticket};
use arrow_json::ArrayWriter;
use bollard::Docker;
use datafusion::parquet::arrow::ParquetRecordBatchStreamBuilder;
use datafusion::physical_plan::common;
use futures_util::{StreamExt, TryStreamExt};
use modelardb_embedded::operations::client::{Client, Node};
use modelardb_embedded::operations::Operations;
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

const TABLE_NAME: &str = "wind";

const NODE_COUNT: u64 = 4;

struct AppState {
    ingestion_task: Option<JoinHandle<()>>,
    flush_task: Option<JoinHandle<()>>,
    monitor_nodes_task: Option<JoinHandle<()>>,
    modelardb_remote_object_store: AmazonS3,
    parquet_remote_object_store: AmazonS3,
}

impl AppState {
    fn new() -> Self {
        let modelardb_remote_object_store = build_s3_object_store("modelardb".to_owned());
        let parquet_remote_object_store = build_s3_object_store("parquet".to_owned());

        Self {
            ingestion_task: None,
            flush_task: None,
            monitor_nodes_task: None,
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
async fn reset_state(state: State<'_, Mutex<AppState>>) -> Result<(), String> {
    let state = state.lock().await;

    // Abort any running tasks.
    if let Some(handle) = &state.ingestion_task {
        handle.abort();
    }

    if let Some(handle) = &state.flush_task {
        handle.abort();
    }

    if let Some(handle) = &state.monitor_nodes_task {
        handle.abort();
    }

    // Drop the tables.
    let modelardb_manager_node = Node::Manager("grpc://127.0.0.1:9980".to_owned());
    let mut modelardb_client = Client::connect(modelardb_manager_node).await.unwrap();
    modelardb_client.drop(TABLE_NAME).await.unwrap();

    let parquet_manager_node = Node::Manager("grpc://127.0.0.1:9880".to_owned());
    let mut parquet_client = Client::connect(parquet_manager_node).await.unwrap();
    parquet_client.drop(TABLE_NAME).await.unwrap();

    Ok(())
}

#[tauri::command]
async fn create_tables(error_bound: usize) {
    let modelardb_manager_node = Node::Manager("grpc://127.0.0.1:9980".to_owned());
    let mut modelardb_client = Client::connect(modelardb_manager_node).await.unwrap();

    let table_schema = table_schema();

    let field_column_names = vec![
        "wind_speed",
        "pitch_angle",
        "rotor_speed",
        "active_power",
        "cos_nacelle_dir",
        "sin_nacelle_dir",
        "cos_wind_dir",
        "sin_wind_dir",
        "cor_nacelle_direction",
        "cor_wind_direction",
    ];

    let error_bounds: HashMap<String, ErrorBound> = field_column_names
        .clone()
        .into_iter()
        .map(|name| {
            (
                name.to_owned(),
                ErrorBound::try_new_absolute(error_bound as f32).unwrap(),
            )
        })
        .collect();

    let error_bound_table_type =
        TableType::TimeSeriesTable(table_schema.clone(), error_bounds, HashMap::new());

    modelardb_client
        .create(TABLE_NAME, error_bound_table_type)
        .await
        .unwrap();

    let parquet_manager_node = Node::Manager("grpc://127.0.0.1:9880".to_owned());
    let mut parquet_client = Client::connect(parquet_manager_node).await.unwrap();

    let table_type = TableType::NormalTable(table_schema.clone());

    parquet_client
        .create(TABLE_NAME, table_type.clone())
        .await
        .unwrap();
}

#[tauri::command]
async fn ingest_into_table(
    app: AppHandle,
    state: State<'_, Mutex<AppState>>,
    count: usize,
) -> Result<(), String> {
    let mut state = state.lock().await;

    if let Some(handle) = &state.ingestion_task {
        handle.abort();
    }

    let join_handle = tokio::spawn(ingest_into_table_task(app, count));
    state.ingestion_task = Some(join_handle);

    Ok(())
}

async fn ingest_into_table_task(app: AppHandle, count: usize) {
    let file = tokio::fs::File::open("../data/wind_cleaned.parquet")
        .await
        .unwrap();
    let builder = ParquetRecordBatchStreamBuilder::new(file).await.unwrap();

    let stream = builder.build().unwrap();
    let record_batches = stream.try_collect::<Vec<_>>().await.unwrap();
    let record_batch =
        compute::concat_batches(&record_batches[0].schema(), &record_batches).unwrap();

    let edge_nodes = edge_nodes();
    let edge_clients = connect_to_nodes(edge_nodes).await;

    let mut offset = 0;

    let mut node_record_batches = vec![];
    for node_index in 0..NODE_COUNT {
        let node_record_batch = record_batch.slice((30000 * node_index) as usize, 30000);
        node_record_batches.push(node_record_batch);
    }

    loop {
        for (index, (modelardb_client, parquet_client)) in edge_clients.iter().enumerate() {
            tokio::spawn(ingest_data_points_into_nodes(
                app.clone(),
                modelardb_client.clone(),
                parquet_client.clone(),
                index,
                node_record_batches[index].slice(offset, count),
            ));
        }

        offset += count;

        if offset + count > 30000 {
            offset = 0;
        }

        time::sleep(Duration::from_secs(1)).await;
    }
}

#[derive(Clone, Serialize)]
struct IngestedSize {
    table_name: String,
    size: usize,
}

async fn ingest_data_points_into_nodes(
    app: AppHandle,
    mut modelardb_client: Client,
    mut parquet_client: Client,
    node_id: usize,
    data_points: RecordBatch,
) {
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
            data_points.column(0).clone(),
            data_points.column(1).clone(),
            data_points.column(2).clone(),
            data_points.column(3).clone(),
            data_points.column(4).clone(),
            data_points.column(5).clone(),
            data_points.column(6).clone(),
            data_points.column(7).clone(),
            data_points.column(8).clone(),
            data_points.column(9).clone(),
        ],
    )
    .unwrap();

    // One 8-byte timestamp, two 4-byte tags, and ten 4-byte fields per row.
    let ingested_size = (8 + (12 * 4)) * data_points.num_rows();

    app.emit(
        "data-ingested",
        IngestedSize {
            table_name: TABLE_NAME.to_owned(),
            size: ingested_size,
        },
    )
    .unwrap();

    modelardb_client
        .write(TABLE_NAME, record_batch.clone())
        .await
        .unwrap();
    parquet_client
        .write(TABLE_NAME, record_batch)
        .await
        .unwrap();
}

fn table_schema() -> Schema {
    Schema::new(vec![
        Field::new("timestamp", ArrowTimestamp::DATA_TYPE, false),
        Field::new("park_id", DataType::Utf8, false),
        Field::new("windmill_id", DataType::Utf8, false),
        Field::new("wind_speed", ArrowValue::DATA_TYPE, false),
        Field::new("pitch_angle", ArrowValue::DATA_TYPE, false),
        Field::new("rotor_speed", ArrowValue::DATA_TYPE, false),
        Field::new("active_power", ArrowValue::DATA_TYPE, false),
        Field::new("cos_nacelle_dir", ArrowValue::DATA_TYPE, false),
        Field::new("sin_nacelle_dir", ArrowValue::DATA_TYPE, false),
        Field::new("cos_wind_dir", ArrowValue::DATA_TYPE, false),
        Field::new("sin_wind_dir", ArrowValue::DATA_TYPE, false),
        Field::new("cor_nacelle_direction", ArrowValue::DATA_TYPE, false),
        Field::new("cor_wind_direction", ArrowValue::DATA_TYPE, false),
    ])
}

#[tauri::command]
async fn flush_nodes(
    app: AppHandle,
    state: State<'_, Mutex<AppState>>,
    interval_seconds: u64,
) -> Result<(), String> {
    let mut state = state.lock().await;

    if let Some(handle) = &state.flush_task {
        handle.abort();
    }

    let join_handle = tokio::spawn(flush_nodes_task(
        app,
        state.modelardb_remote_object_store.clone(),
        state.parquet_remote_object_store.clone(),
        interval_seconds,
    ));

    state.flush_task = Some(join_handle);

    Ok(())
}

async fn flush_nodes_task(
    app: AppHandle,
    modelardb_remote_object_store: AmazonS3,
    parquet_remote_object_store: AmazonS3,
    interval_seconds: u64,
) {
    let edge_nodes = edge_nodes();

    loop {
        for (modelardb_node, parquet_node) in &edge_nodes {
            app.emit("flushing-modelardb-node", modelardb_node.url())
                .unwrap();

            tokio::spawn(flush_node_and_emit_remote_object_store_table_size(
                app.clone(),
                modelardb_node.clone(),
                modelardb_remote_object_store.clone(),
                "modelardb".to_owned(),
            ));

            app.emit("flushing-parquet-node", parquet_node.url())
                .unwrap();

            tokio::spawn(flush_node_and_emit_remote_object_store_table_size(
                app.clone(),
                parquet_node.clone(),
                parquet_remote_object_store.clone(),
                "parquet".to_owned(),
            ));

            time::sleep(Duration::from_secs(interval_seconds / NODE_COUNT)).await;
        }
    }
}

async fn flush_node_and_emit_remote_object_store_table_size(
    app: AppHandle,
    node: Node,
    object_store: AmazonS3,
    node_type: String,
) {
    let mut flight_client = FlightServiceClient::connect(node.url().to_owned())
        .await
        .unwrap();

    let action = Action {
        r#type: "FlushNode".to_owned(),
        body: vec![].into(),
    };

    flight_client.do_action(action).await.unwrap();

    // Vacuum the node to remove any deleted data.
    flight_client
        .do_get(Ticket::new("VACUUM".to_owned()))
        .await
        .unwrap();

    emit_remote_object_store_table_size(app, object_store, node_type).await;
}

#[derive(Clone, Serialize)]
struct RemoteObjectStoreTableSize {
    node_type: String,
    table_size: u64,
}

async fn emit_remote_object_store_table_size(
    app: AppHandle,
    object_store: AmazonS3,
    node_type: String,
) {
    let table_size = table_size(&object_store, TABLE_NAME).await;

    app.emit(
        "remote-object-store-size",
        RemoteObjectStoreTableSize {
            node_type: node_type.clone(),
            table_size,
        },
    )
    .unwrap();
}

#[tauri::command]
async fn monitor_nodes(
    app: AppHandle,
    state: State<'_, Mutex<AppState>>,
    interval_seconds: u64,
) -> Result<(), String> {
    let mut state = state.lock().await;

    if let Some(handle) = &state.monitor_nodes_task {
        handle.abort();
    }

    let join_handle = tokio::spawn(monitor_nodes_task(app, interval_seconds));
    state.monitor_nodes_task = Some(join_handle);

    Ok(())
}

async fn monitor_nodes_task(app: AppHandle, interval_seconds: u64) {
    let docker = Docker::connect_with_local_defaults().unwrap();

    loop {
        let data_usage = docker.df(None).await.unwrap();
        let volumes = data_usage.volumes.unwrap();

        for volume in volumes {
            if volume.name.starts_with("modelardb-cluster") {
                let size = volume.usage_data.unwrap().size;
                let node_name = volume.name.replace("modelardb-cluster_", "");

                app.emit(&format!("{node_name}-node-size"), size).unwrap();
            }
        }
        time::sleep(Duration::from_secs(interval_seconds)).await;
    }
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

fn edge_nodes() -> Vec<(Node, Node)> {
    vec![
        (
            Node::Server("grpc://127.0.0.1:9981".to_owned()),
            Node::Server("grpc://127.0.0.1:9881".to_owned()),
        ),
        (
            Node::Server("grpc://127.0.0.1:9982".to_owned()),
            Node::Server("grpc://127.0.0.1:9882".to_owned()),
        ),
        (
            Node::Server("grpc://127.0.0.1:9983".to_owned()),
            Node::Server("grpc://127.0.0.1:9883".to_owned()),
        ),
        (
            Node::Server("grpc://127.0.0.1:9984".to_owned()),
            Node::Server("grpc://127.0.0.1:9884".to_owned()),
        ),
    ]
}

async fn connect_to_nodes(nodes: Vec<(Node, Node)>) -> Vec<(Client, Client)> {
    let mut clients = vec![];

    for (modelardb_node, parquet_node) in nodes {
        let modelardb_client = Client::connect(modelardb_node).await.unwrap();
        let parquet_client = Client::connect(parquet_node).await.unwrap();

        clients.push((modelardb_client, parquet_client));
    }

    clients
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
    let node = Node::Server(url.clone());
    let mut client = Client::connect(node.clone()).await.unwrap();

    // If it is not a cloud node, flush the memory of the edge node before querying.
    if url != *"grpc://127.0.0.1:9999" && url != *"grpc://127.0.0.1:9899" {
        let mut flight_client = FlightServiceClient::connect(node.url().to_owned())
            .await
            .unwrap();

        let action = Action {
            r#type: "FlushMemory".to_owned(),
            body: vec![].into(),
        };

        flight_client.do_action(action).await.unwrap();
    }

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

#[tauri::command]
async fn run_python_script(filename: String) -> (Vec<u8>, Vec<u8>, i32) {
    let script_dir =
        fs::canonicalize("../ModelarDB-RS/crates/modelardb_embedded/bindings/python").unwrap();

    fs::copy(
        format!("../scripts/{}", filename),
        script_dir.join(&filename),
    )
    .unwrap();

    let output = Command::new("python")
        .current_dir(&script_dir)
        .arg(&filename)
        .output()
        .unwrap();

    fs::remove_file(script_dir.join(&filename)).unwrap();

    (
        output.stdout,
        output.stderr,
        output.status.code().unwrap_or(1),
    )
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
            reset_state,
            create_tables,
            ingest_into_table,
            flush_nodes,
            monitor_nodes,
            client_tables,
            client_query,
            run_python_script,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
