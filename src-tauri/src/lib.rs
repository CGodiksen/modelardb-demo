use modelardb_embedded::modelardb::client::{Client, Node};
use modelardb_embedded::modelardb::ModelarDB;

#[tauri::command]
async fn client_tables(url: String) -> Vec<(String, Vec<(String, String)>)> {
    let node = Node::Server(url);
    let mut client = Client::connect(node).await.unwrap();

    let table_names = client.tables().await.unwrap();

    let mut tables = vec![];
    for table_name in table_names {
        let schema = client.schema(&table_name).await.unwrap();

        let mut columns = vec![];
        for field in schema.fields() {
            columns.push((field.name().to_owned(), field.data_type().to_string()));
        }

        tables.push((table_name, columns));
    }

    tables
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![client_tables])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
