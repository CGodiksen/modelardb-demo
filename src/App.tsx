import { invoke } from "@tauri-apps/api/core";
import { useHotkeys } from "@mantine/hooks";
import { useEffect } from "react";
import { listen } from "@tauri-apps/api/event";
import { AppShell, Container, Grid, MantineProvider } from "@mantine/core";

import { NodeMap } from "./components/NodeMap/NodeMap.tsx";
import {
  IngestedSize,
  RemoteObjectStoreTableSize,
} from "./interfaces/event.ts";

import { theme } from "./theme";
import "@mantine/core/styles.css";
import "./App.css";
import { NodeGroup } from "./components/NodeGroup/NodeGroup.tsx";
import { Configuration } from "./components/Configuration/Configuration.tsx";
import { DataTransferChart } from "./components/DataTransferChart/DataTransferChart.tsx";

export default function App() {
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
          intervalSeconds: 60,
        }).then(() => {
          console.log("Started flushing data from nodes.");
        });
      },
    ],
  ]);

  useEffect(() => {
    listen<RemoteObjectStoreTableSize>("remote-object-store-size", (event) => {
      if (event.payload.node_type === "modelardb") {
        console.log(event);
      } else {
        console.log(event);
      }
    });

    listen<IngestedSize>("data-ingested", (event) => {
      console.log(event);
    });
  }, []);

  return (
    <MantineProvider defaultColorScheme="dark" theme={theme}>
      <AppShell padding="sm">
        <AppShell.Main pb={0} pe={5}>
          <Container m={5} p={5} fluid>
            <Grid columns={24} grow>
              <Grid.Col span={6} h={"29vh"}>
                <Configuration></Configuration>
              </Grid.Col>
              <Grid.Col span={18}>
                <DataTransferChart></DataTransferChart>
              </Grid.Col>
              <Grid.Col span={6} h={"68vh"}>
                <Grid grow>
                  <Grid.Col span={12} h={"33vh"}>
                    <NodeGroup></NodeGroup>
                  </Grid.Col>
                  <Grid.Col span={12} h={"33vh"}>
                    <NodeGroup></NodeGroup>
                  </Grid.Col>
                </Grid>
              </Grid.Col>
              <Grid.Col span={18}>
                <NodeMap></NodeMap>
              </Grid.Col>
            </Grid>
          </Container>
        </AppShell.Main>
      </AppShell>
    </MantineProvider>
  );
}
