use std::collections::HashMap;
use std::iter;
use std::sync::Arc;
use std::time::{Duration, SystemTime, UNIX_EPOCH};

use arrow::array::{RecordBatch, StringArray};
use arrow::compute;
use arrow::datatypes::{ArrowPrimitiveType, DataType, Field, Schema};
use arrow_json::ArrayWriter;
use datafusion::parquet::arrow::ParquetRecordBatchStreamBuilder;
use datafusion::physical_plan::common;
use futures_util::stream::FuturesUnordered;
use futures_util::{StreamExt, TryStreamExt};
use modelardb_embedded::modelardb::client::{Client, Node};
use modelardb_embedded::modelardb::ModelarDB;
use modelardb_embedded::TableType;
use modelardb_types::types::{ArrowTimestamp, ArrowValue, ErrorBound, TimestampBuilder};
use tauri::{Manager, State};
use tokio::sync::Mutex;
use tokio::task::JoinHandle;
use tokio::time;

#[derive(Default)]
struct AppState {
    ingestion_tasks: HashMap<String, JoinHandle<()>>,
}

#[tauri::command]
async fn create_tables() {
    let manager_node = Node::Manager("grpc://127.0.0.1:9998".to_owned());
    let mut client = Client::connect(manager_node).await.unwrap();

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
        TableType::ModelTable(table_schema, fifteen_error_bounds, HashMap::new());

    client
        .create("lossless_table", lossless_table_type)
        .await
        .unwrap();
    client
        .create("five_error_bound_table", five_error_bound_table_type)
        .await
        .unwrap();
    client
        .create("fifteen_error_bound_table", fifteen_error_bound_table_type)
        .await
        .unwrap();
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

    let join_handle = tokio::spawn(ingest_data_points(table_name.clone(), count));
    state.ingestion_tasks.insert(table_name, join_handle);

    Ok(())
}

async fn ingest_data_points(table_name: String, count: usize) {
    let file = tokio::fs::File::open("../data/wind.parquet").await.unwrap();
    let builder = ParquetRecordBatchStreamBuilder::new(file).await.unwrap();

    let stream = builder.build().unwrap();
    let record_batches = stream.try_collect::<Vec<_>>().await.unwrap();
    let record_batch =
        compute::concat_batches(&record_batches[0].schema(), &record_batches).unwrap();

    let edge_nodes = vec![
        Node::Server("grpc://127.0.0.1:9981".to_owned()),
        Node::Server("grpc://127.0.0.1:9982".to_owned()),
        Node::Server("grpc://127.0.0.1:9983".to_owned()),
        Node::Server("grpc://127.0.0.1:9984".to_owned()),
        Node::Server("grpc://127.0.0.1:9985".to_owned()),
        Node::Server("grpc://127.0.0.1:9986".to_owned()),
        Node::Server("grpc://127.0.0.1:9987".to_owned()),
        Node::Server("grpc://127.0.0.1:9988".to_owned()),
        Node::Server("grpc://127.0.0.1:9989".to_owned()),
        Node::Server("grpc://127.0.0.1:9990".to_owned()),
    ];

    let mut offset = 0;

    loop {
        let mut futures: FuturesUnordered<_> = edge_nodes
            .iter()
            .enumerate()
            .map(|(index, node)| {
                ingest_data_points_into_node(
                    node.clone(),
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

        time::sleep(Duration::from_secs(2)).await;
    }
}

async fn ingest_data_points_into_node(
    node: Node,
    node_id: usize,
    table_name: &str,
    data_points: RecordBatch,
) {
    let mut client = Client::connect(node).await.unwrap();

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

    client.write(table_name, record_batch).await.unwrap();
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
            app.manage(Mutex::new(AppState::default()));
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            create_tables,
            ingest_into_table,
            client_tables,
            client_query
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
