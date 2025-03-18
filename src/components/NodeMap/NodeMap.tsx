import { Container } from "@mantine/core";
import { APIProvider, Map } from "@vis.gl/react-google-maps";

import { NodeMarker } from "../NodeMarker/NodeMarker.tsx";

export function NodeMap({}) {
  const node = {
    url: "grpc://127.0.0.1:9999",
    latitude: 51.5074,
    longitude: 0.1278,
  };

  return (
    <Container fluid>
      <APIProvider apiKey={import.meta.env.VITE_GOOGLE_MAPS_API_KEY}>
        <Map
          style={{ height: "72vh" }}
          defaultCenter={{ lat: 52.0133437, lng: -1.5911737 }}
          defaultZoom={7}
          gestureHandling={"greedy"}
          disableDefaultUI={true}
          mapTypeId={"hybrid"}
          mapId={"DEMO_MAP_ID"}
        >
          <NodeMarker node={node}></NodeMarker>
        </Map>
      </APIProvider>
    </Container>
  );
}
