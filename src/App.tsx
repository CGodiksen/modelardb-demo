import { invoke } from "@tauri-apps/api/core";
import { useHotkeys } from "@mantine/hooks";
import { AppShell, Container, Grid, MantineProvider } from "@mantine/core";

import { NodeMap } from "./components/NodeMap/NodeMap.tsx";

import { theme } from "./theme";
import { NodeGroup } from "./components/NodeGroup/NodeGroup.tsx";
import { Configuration } from "./components/Configuration/Configuration.tsx";
import { DataTransferChart } from "./components/DataTransferChart/DataTransferChart.tsx";
import "@mantine/core/styles.css";
import "./App.css";

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
          intervalSeconds: 20,
        }).then(() => {
          console.log("Started flushing data from nodes.");
        });
      },
    ],
  ]);

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
