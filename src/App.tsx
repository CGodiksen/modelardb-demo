import { invoke } from "@tauri-apps/api/core";
import { useHotkeys } from "@mantine/hooks";
import { AppShell, Container, Grid, MantineProvider } from "@mantine/core";
import { NodeMap } from "./components/NodeMap/NodeMap.tsx";
import { theme } from "./theme";
import { NodeGroup } from "./components/NodeGroup/NodeGroup.tsx";
import { Configuration } from "./components/Configuration/Configuration.tsx";
import { DataTransferChart } from "./components/DataTransferChart/DataTransferChart.tsx";
import { useEffect, useState } from "react";
import { ModelardbNode } from "./interfaces/node.ts";
import "@mantine/core/styles.css";
import "./App.css";

export default function App() {
  const [nodes, setNodes] = useState<ModelardbNode[]>([]);

  useHotkeys([
    [
      "ctrl+r",
      () => {
        invoke("ingest_into_table", {
          count: 1000,
        }).then(() => {
          console.log(`Started ingesting data into the table.`);
        });
      },
    ],
  ]);

  useHotkeys([
    [
      "ctrl+t",
      () => {
        invoke("create_tables", {}).then(() => {
          console.log("Tables created successfully.");
        });
      },
    ],
  ]);

  useHotkeys([
    [
      "ctrl+f",
      () => {
        invoke("flush_nodes", {
          intervalSeconds: 20,
        }).then(() => {
          console.log("Started flushing data from nodes.");
        });
      },
    ],
  ]);

  useEffect(() => {
    fetch("/data/nodes.json")
      .then((res) => res.json())
      .then((data) => setNodes(data))
      .catch((error) => console.error("Error fetching nodes:", error));
  }, []);

  return (
    <MantineProvider defaultColorScheme="dark" theme={theme}>
      <AppShell padding="sm">
        <AppShell.Main pb={0} pe={5}>
          <Container m={5} p={5} fluid>
            <Grid columns={24} grow>
              <Grid.Col span={7} h={"25vh"}>
                <Configuration></Configuration>
              </Grid.Col>
              <Grid.Col span={17}>
                <DataTransferChart></DataTransferChart>
              </Grid.Col>
              <Grid.Col span={7} h={"72vh"}>
                <Grid grow>
                  <Grid.Col span={12} h={"35vh"}>
                    <NodeGroup
                      type="modelardb"
                      nodes={nodes.filter(
                        (node) =>
                          node.type === "modelardb" &&
                          node.server_mode === "edge"
                      )}
                    ></NodeGroup>
                  </Grid.Col>
                  <Grid.Col span={12} h={"35vh"} pt={15}>
                    <NodeGroup
                      type="parquet"
                      nodes={nodes.filter(
                        (node) =>
                          node.type === "parquet" && node.server_mode === "edge"
                      )}
                    ></NodeGroup>
                  </Grid.Col>
                </Grid>
              </Grid.Col>
              <Grid.Col span={17}>
                <NodeMap nodes={nodes}></NodeMap>
              </Grid.Col>
            </Grid>
          </Container>
        </AppShell.Main>
      </AppShell>
    </MantineProvider>
  );
}
