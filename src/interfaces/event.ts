export interface RemoteObjectStoreTableSize {
  node_type: string;
  table_1_size: number;
  table_2_size: number;
  table_3_size: number;
}

export interface IngestedSize {
  table_name: string;
  size: number;
}

export interface BucketedData {
  timestamp: number;
  ingested_bytes: number;
  transferred_bytes: number;
}
