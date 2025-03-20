export interface ModelardbNode {
  url: string;
  server_mode: "edge" | "cloud" | "local";
  latitude: number;
  longitude: number;
}
