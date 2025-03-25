export interface RemoteObjectStoreTableSize {
  node_type: string;
  wind_1_size: number;
  wind_2_size: number;
  wind_3_size: number;
}

export interface IngestedSize {
  table_name: string;
  size: number;
}

export interface BucketedData {
  timestamp: number;
  ingested_bytes: number;
}
