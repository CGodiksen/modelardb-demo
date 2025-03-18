use arrow::array::RecordBatch;
use arrow_json::ArrayWriter;
use datafusion::physical_plan::common;
use modelardb_embedded::modelardb::client::{Client, Node};
use modelardb_embedded::modelardb::ModelarDB;

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

#[derive(serde::Serialize)]
struct ClientQueryResponse {
    column_names: Vec<String>,
    data: Vec<u8>,
}

#[tauri::command]
async fn client_query(url: String, query: String) -> ClientQueryResponse {
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

    let data = writer.into_inner();

    ClientQueryResponse {
        column_names: record_batches[0]
            .schema()
            .fields()
            .iter()
            .map(|field| field.name().to_owned())
            .collect(),
        data,
    }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![client_tables, client_query])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
