use arrow::datatypes::{ArrowPrimitiveType, DataType, Field, Schema};
use futures_util::StreamExt;
use modelardb_embedded::operations::client::{Client, Node};
use modelardb_types::types::{ArrowTimestamp, ArrowValue};
use object_store::aws::{AmazonS3, AmazonS3Builder};
use object_store::path::Path;
use object_store::ObjectStore;
use std::collections::HashMap;
use url::Url;

pub(super) fn build_s3_object_store(bucket_name: String) -> AmazonS3 {
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

pub(super) fn table_schema() -> Schema {
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

pub(super) async fn table_size(object_store: &AmazonS3, table_name: &str) -> u64 {
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

pub(super) fn edge_nodes() -> Vec<(Node, Node)> {
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

pub(super) async fn connect_to_nodes(nodes: Vec<(Node, Node)>) -> Vec<(Client, Client)> {
    let mut clients = vec![];

    for (modelardb_node, parquet_node) in nodes {
        let modelardb_client = Client::connect(modelardb_node).await.unwrap();
        let parquet_client = Client::connect(parquet_node).await.unwrap();

        clients.push((modelardb_client, parquet_client));
    }

    clients
}
