import { useEffect, useState } from "react";
import { Container } from "@mantine/core";
import { APIProvider, Map } from "@vis.gl/react-google-maps";

import { NodeMarker } from "../NodeMarker/NodeMarker.tsx";
import { ModelardbNode } from "../../interfaces/node.ts";
import { listen } from "@tauri-apps/api/event";
import { invoke } from "@tauri-apps/api/core";

export function NodeMap({ nodes }: { nodes: ModelardbNode[] }) {
  const [flushingModelardbNode, setFlushingModelardbNode] = useState("");
  const [flushingComparisonNode, setFlushingComparisonNode] = useState("");
  const [apiKey, setApiKey] = useState("");

  useEffect(() => {
    listen<string>("flushing-modelardb-node", (event) => {
      setFlushingModelardbNode(event.payload);
    });

    listen<string>("flushing-comparison-node", (event) => {
      setFlushingComparisonNode(event.payload);
    });
  }, []);

  useEffect(() => {
    invoke("google_maps_api_key").then(
      // @ts-ignore
      (message: string) => {
        setApiKey(message);
      }
    );
  }, []);

  return (
    <Container fluid ps={5} pe={5}>
      {apiKey && (
        <APIProvider apiKey={apiKey}>
          <Map
            style={{ height: "70vh" }}
            defaultCenter={{ lat: 51.3980119, lng: 0.4886247 }}
            defaultZoom={8.2}
            gestureHandling={"greedy"}
            disableDefaultUI={true}
            mapTypeId={"hybrid"}
            mapId={"DEMO_MAP_ID"}
          >
            {nodes.map((node, index) => (
              <NodeMarker
                key={index}
                node={node}
                flushingNode={
                  node.type == "modelardb"
                    ? flushingModelardbNode
                    : flushingComparisonNode
                }
              ></NodeMarker>
            ))}
          </Map>
        </APIProvider>
      )}
    </Container>
  );
}
