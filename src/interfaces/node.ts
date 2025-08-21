export interface ModelardbNode {
  type: "modelardb" | "comparison";
  url: string | undefined;
  server_mode: "edge" | "cloud" | "local";
  latitude: number;
  longitude: number;
}
