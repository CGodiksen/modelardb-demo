import { Container } from "@mantine/core";
import { APIProvider, Map } from "@vis.gl/react-google-maps";

import { NodeMarker } from "../NodeMarker/NodeMarker.tsx";
import { nodes } from "../../data/nodes.ts";

export function NodeMap({}) {
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
          {nodes.map((node) => (
            <NodeMarker node={node}></NodeMarker>
          ))}
        </Map>
      </APIProvider>
    </Container>
  );
}
