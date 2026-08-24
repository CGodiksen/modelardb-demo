import { useEffect, useState } from "react";
import { Container } from "@mantine/core";
import {
  APIProvider,
  ControlPosition,
  Map,
  MapControl,
} from "@vis.gl/react-google-maps";

import { NodeMarker } from "../NodeMarker/NodeMarker.tsx";
import { MapResetControl } from "../MapResetControl/MapResetControl.tsx";
import { MAP_DEFAULT_CENTER, MAP_DEFAULT_ZOOM } from "../../constants.ts";
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
      },
    );
  }, []);

  return (
    <Container fluid ps={5} pe={5}>
      {apiKey && (
        <APIProvider apiKey={apiKey}>
          <Map
            style={{ height: "70vh" }}
            defaultCenter={MAP_DEFAULT_CENTER}
            defaultZoom={MAP_DEFAULT_ZOOM}
            gestureHandling={"greedy"}
            disableDefaultUI={true}
            mapTypeId={"hybrid"}
            mapId={"DEMO_MAP_ID"}
          >
            <MapControl position={ControlPosition.TOP_RIGHT}>
              <MapResetControl></MapResetControl>
            </MapControl>

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
