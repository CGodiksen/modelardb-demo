export interface ModelardbNode {
  type: "modelardb" | "parquet";
  url: string | undefined;
  server_mode: "edge" | "cloud" | "local";
  latitude: number;
  longitude: number;
}
