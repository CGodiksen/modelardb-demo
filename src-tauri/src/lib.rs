use std::collections::HashMap;
use std::iter;
use std::sync::Arc;
use std::time::{Duration, SystemTime, UNIX_EPOCH};

use arrow::array::{RecordBatch, StringArray};
use arrow::compute;
use arrow_flight::flight_service_client::FlightServiceClient;
use arrow_flight::{Action, Ticket};
use arrow_json::ArrayWriter;
use bollard::Docker;
use datafusion::parquet::arrow::ParquetRecordBatchStreamBuilder;
use datafusion::physical_plan::common;
use futures_util::TryStreamExt;
use modelardb_embedded::operations::client::{Client, Node};
use modelardb_embedded::operations::Operations;
use modelardb_embedded::TableType;
use modelardb_types::types::{ErrorBound, TimestampBuilder};
use object_store::aws::AmazonS3;
use serde::{Deserialize, Serialize};
use tauri::{AppHandle, Emitter, Manager, State};
use tokio::sync::Mutex;
use tokio::task::JoinHandle;
use tokio::time;
use tonic::transport::Channel;

mod util;

const TABLE_NAME: &str = "wind";

const NODE_COUNT: u64 = 4;

struct AppState {
    ingestion_task: Option<JoinHandle<()>>,
    flush_modelardb_task: Option<JoinHandle<()>>,
    flush_comparison_task: Option<JoinHandle<()>>,
    monitor_nodes_task: Option<JoinHandle<()>>,
    modelardb_remote_object_store: AmazonS3,
    comparison_remote_object_store: AmazonS3,
}

impl AppState {
    fn new() -> Self {
        let modelardb_remote_object_store = util::build_s3_object_store("modelardb".to_owned());
        let comparison_remote_object_store = util::build_s3_object_store("comparison".to_owned());

        Self {
            ingestion_task: None,
            flush_modelardb_task: None,
            flush_comparison_task: None,
            monitor_nodes_task: None,
            modelardb_remote_object_store,
            comparison_remote_object_store,
        }
    }
}

#[tauri::command]
async fn reset_state(state: State<'_, Mutex<AppState>>) -> Result<(), String> {
    let state = state.lock().await;

    // Abort any running tasks.
    if let Some(handle) = &state.ingestion_task {
        handle.abort();
    }

    if let Some(handle) = &state.flush_modelardb_task {
        handle.abort();
    }

    if let Some(handle) = &state.flush_comparison_task {
        handle.abort();
    }

    if let Some(handle) = &state.monitor_nodes_task {
        handle.abort();
    }

    // Drop the tables and delete all files.
    let modelardb_manager_node = Node::Manager("grpc://127.0.0.1:9980".to_owned());
    let mut modelardb_client = Client::connect(modelardb_manager_node).await.unwrap();
    modelardb_client.drop(TABLE_NAME).await.unwrap();

    for (_modelardb_node, comparison_node) in util::edge_nodes() {
        let mut comparison_client = FlightServiceClient::connect(comparison_node.url().to_owned())
            .await
            .unwrap();

        let action = Action {
            r#type: "ResetNode".to_owned(),
            body: vec![].into(),
        };

        comparison_client.do_action(action).await.unwrap();
    }

    Ok(())
}

#[tauri::command]
async fn create_table(error_bound: usize) {
    let modelardb_manager_node = Node::Manager("grpc://127.0.0.1:9980".to_owned());
    let mut modelardb_client = Client::connect(modelardb_manager_node).await.unwrap();

    let table_schema = util::table_schema();

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
}

#[tauri::command]
async fn ingest_into_table(
    app: AppHandle,
    state: State<'_, Mutex<AppState>>,
    count: usize,
    comparison: String,
) -> Result<(), String> {
    let mut state = state.lock().await;

    if let Some(handle) = &state.ingestion_task {
        handle.abort();
    }

    let join_handle = tokio::spawn(ingest_into_table_task(app, count, comparison));
    state.ingestion_task = Some(join_handle);

    Ok(())
}

async fn ingest_into_table_task(app: AppHandle, count: usize, comparison: String) {
    let file = tokio::fs::File::open("../data/wind_cleaned.parquet")
        .await
        .unwrap();
    let builder = ParquetRecordBatchStreamBuilder::new(file).await.unwrap();

    let stream = builder.build().unwrap();
    let record_batches = stream.try_collect::<Vec<_>>().await.unwrap();
    let record_batch =
        compute::concat_batches(&record_batches[0].schema(), &record_batches).unwrap();

    let edge_nodes = util::edge_nodes();
    let edge_clients = util::connect_to_nodes(edge_nodes).await;

    let mut offset = 0;

    let mut node_record_batches = vec![];
    for node_index in 0..NODE_COUNT {
        let node_record_batch = record_batch.slice((30000 * node_index) as usize, 30000);
        node_record_batches.push(node_record_batch);
    }

    loop {
        for (index, (modelardb_client, comparison_client)) in edge_clients.iter().enumerate() {
            tokio::spawn(ingest_data_points_into_nodes(
                app.clone(),
                modelardb_client.clone(),
                comparison_client.clone(),
                index,
                node_record_batches[index].slice(offset, count),
                comparison.clone(),
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
    mut comparison_client: FlightServiceClient<Channel>,
    node_id: usize,
    data_points: RecordBatch,
    comparison: String,
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
        Arc::new(util::table_schema()),
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

    let record_batch_bytes = util::try_convert_record_batch_to_bytes(&record_batch);
    let action = Action {
        r#type: format!(
            "IngestData{}",
            comparison[..1].to_uppercase() + &comparison[1..]
        ),
        body: record_batch_bytes.into(),
    };

    comparison_client.do_action(action).await.unwrap();
}

#[tauri::command]
async fn flush_nodes(app: AppHandle, state: State<'_, Mutex<AppState>>) -> Result<(), String> {
    let mut state = state.lock().await;

    if let Some(handle) = &state.flush_modelardb_task {
        handle.abort();
    }

    let join_handle = tokio::spawn(flush_modelardb_nodes_task(
        app.clone(),
        state.modelardb_remote_object_store.clone(),
    ));

    state.flush_modelardb_task = Some(join_handle);

    if let Some(handle) = &state.flush_comparison_task {
        handle.abort();
    }

    let join_handle = tokio::spawn(flush_comparison_nodes_task(
        app,
        state.comparison_remote_object_store.clone(),
    ));

    state.flush_comparison_task = Some(join_handle);

    Ok(())
}

async fn flush_modelardb_nodes_task(app: AppHandle, modelardb_remote_object_store: AmazonS3) {
    let edge_nodes = util::edge_nodes();
    let mut iteration_counter = 0;

    loop {
        let flush_modelardb_node = iteration_counter % 4 == 0;
        iteration_counter = iteration_counter + 1;

        for (modelardb_node, _comparison_node) in &edge_nodes {
            tokio::spawn(
                flush_modelardb_node_and_emit_remote_object_store_table_size(
                    app.clone(),
                    modelardb_node.clone(),
                    modelardb_remote_object_store.clone(),
                    flush_modelardb_node,
                ),
            );

            time::sleep(Duration::from_secs(2)).await;
        }
    }
}

async fn flush_modelardb_node_and_emit_remote_object_store_table_size(
    app: AppHandle,
    node: Node,
    object_store: AmazonS3,
    flush_node: bool,
) {
    let mut flight_client = FlightServiceClient::connect(node.url().to_owned())
        .await
        .unwrap();

    let action_type = if flush_node {
        "FlushNode"
    } else {
        "FlushMemory"
    };

    let action = Action {
        r#type: action_type.to_owned(),
        body: vec![].into(),
    };

    flight_client.do_action(action.clone()).await.unwrap();

    if flush_node {
        app.emit("flushing-modelardb-node", node.url()).unwrap();

        // Vacuum the node to remove any deleted data.
        flight_client
            .do_get(Ticket::new("VACUUM".to_owned()))
            .await
            .unwrap();

        emit_remote_object_store_table_size(
            app.clone(),
            object_store.clone(),
            "modelardb".to_owned(),
        )
        .await;
    }
}

async fn flush_comparison_nodes_task(app: AppHandle, comparison_remote_object_store: AmazonS3) {
    let edge_nodes = util::edge_nodes();

    loop {
        for (_modelardb_node, comparison_node) in &edge_nodes {
            tokio::spawn(
                flush_comparison_node_and_emit_remote_object_store_table_size(
                    app.clone(),
                    comparison_node.clone(),
                    comparison_remote_object_store.clone(),
                ),
            );

            time::sleep(Duration::from_secs(1)).await;
        }
    }
}

async fn flush_comparison_node_and_emit_remote_object_store_table_size(
    app: AppHandle,
    node: Node,
    object_store: AmazonS3,
) {
    let mut flight_client = FlightServiceClient::connect(node.url().to_owned())
        .await
        .unwrap();

    let action = Action {
        r#type: "FlushNode".to_owned(),
        body: vec![].into(),
    };

    app.emit("flushing-comparison-node", node.url()).unwrap();

    flight_client.do_action(action.clone()).await.unwrap();

    emit_remote_object_store_table_size(app.clone(), object_store.clone(), "comparison".to_owned())
        .await;
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
    let table_size = util::tables_size(&object_store).await;

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

#[derive(Deserialize)]
struct ScriptRunResponse {
    output: String,
    error: String,
    code: i32,
}

#[tauri::command]
async fn run_python_script(filename: String) -> (Vec<u8>, Vec<u8>, i32) {
    let resp = reqwest::get(format!("http://127.0.0.1:8000/run/?script={filename}"))
        .await
        .unwrap()
        .json::<ScriptRunResponse>()
        .await
        .unwrap();

    (resp.output.into_bytes(), resp.error.into_bytes(), resp.code)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_opener::init())
        .setup(|app| {
            app.manage(Mutex::new(AppState::new()));
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            reset_state,
            create_table,
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
