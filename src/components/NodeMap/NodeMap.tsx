import { useEffect, useState } from "react";
import { Container } from "@mantine/core";
import { APIProvider, Map } from "@vis.gl/react-google-maps";

import { NodeMarker } from "../NodeMarker/NodeMarker.tsx";
import { ModelardbNode } from "../../interfaces/node.ts";

export function NodeMap({}) {
  const [nodes, setNodes] = useState<ModelardbNode[]>([]);

  useEffect(() => {
    fetch("/data/nodes.json")
      .then((res) => res.json())
      .then((data) => setNodes(data))
      .catch((error) => console.error("Error fetching nodes:", error));
  }, []);

  return (
    <Container fluid>
      <APIProvider apiKey={import.meta.env.VITE_GOOGLE_MAPS_API_KEY}>
        <Map
          style={{ height: "72vh" }}
          defaultCenter={{ lat: 51.3980119, lng: -0.1886247 }}
          defaultZoom={8}
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
