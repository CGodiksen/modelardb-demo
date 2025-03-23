use std::collections::HashMap;
use std::time::Duration;

use arrow::array::RecordBatch;
use arrow::datatypes::{ArrowPrimitiveType, DataType, Field, Schema};
use arrow_json::ArrayWriter;
use datafusion::physical_plan::common;
use modelardb_embedded::modelardb::client::{Client, Node};
use modelardb_embedded::modelardb::ModelarDB;
use modelardb_embedded::TableType;
use modelardb_types::types::{ArrowTimestamp, ArrowValue, ErrorBound};
use tauri::{Manager, State};
use tokio::sync::Mutex;
use tokio::task::JoinHandle;
use tokio::time;

#[derive(Default)]
struct AppState {
    ingestion_task: Option<JoinHandle<()>>,
}

#[tauri::command]
async fn create_tables() {
    let manager_node = Node::Manager("grpc://127.0.0.1:9998".to_owned());
    let mut client = Client::connect(manager_node).await.unwrap();

    let table_schema = Schema::new(vec![
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
    ]);

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
async fn ingest_into_tables(
    state: State<'_, Mutex<AppState>>,
    lossless_count: usize,
    five_error_bound_count: usize,
    fifteen_error_bound_count: usize,
) -> Result<(), String> {
    let mut state = state.lock().await;

    if let Some(handle) = &state.ingestion_task {
        handle.abort();
    }

    let join_handle = tokio::spawn(ingest_data_points(
        lossless_count,
        five_error_bound_count,
        fifteen_error_bound_count,
    ));

    state.ingestion_task = Some(join_handle);

    Ok(())
}

async fn ingest_data_points(
    lossless_count: usize,
    five_error_bound_count: usize,
    fifteen_error_bound_count: usize,
) {
    loop {
        println!(
            "Ingesting {lossless_count}, {five_error_bound_count}, {fifteen_error_bound_count} into tables."
        );

        time::sleep(Duration::from_secs(1)).await;
    }
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
            ingest_into_tables,
            client_tables,
            client_query
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
