import { invoke } from "@tauri-apps/api/core";
import { useHotkeys } from "@mantine/hooks";
import { AppShell, Container, Grid, MantineProvider } from "@mantine/core";

import { NodeMap } from "./components/NodeMap/NodeMap.tsx";
import { SimulationStatistics } from "./components/SimulationStatistics/SimulationStatistics.tsx";
import { DataTransferChart } from "./components/DataTransferChart/DataTransferChart.tsx";
import { NodeList } from "./components/NodeList/NodeList.tsx";
import { theme } from "./theme";

import "@mantine/core/styles.css";
import "./App.css";

export default function App() {
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
      "ctrl+r",
      () => {
        invoke("ingest_into_table", {
          tableName: "lossless_table",
          count: 100,
        }).then(() => {
          console.log("Started ingesting data into lossless_table.");
        });

        invoke("ingest_into_table", {
          tableName: "five_error_bound_table",
          count: 200,
        }).then(() => {
          console.log("Started ingesting data into five_error_bound_table.");
        });

        invoke("ingest_into_table", {
          tableName: "fifteen_error_bound_table",
          count: 300,
        }).then(() => {
          console.log("Started ingesting data into fifteen_error_bound_table.");
        });
      },
    ],
  ]);

  useHotkeys([
    [
      "ctrl+f",
      () => {
        invoke("flush_nodes", {
          intervalSeconds: 30,
        }).then(() => {
          console.log("Started flushing data from nodes.");
        });
      },
    ],
  ]);

  return (
    <MantineProvider defaultColorScheme="dark" theme={theme}>
      <AppShell padding="sm">
        <AppShell.Main>
          <Container m={5} p={5} fluid>
            <Grid grow>
              <Grid.Col span={3} h={"72vh"}>
                <NodeList></NodeList>
              </Grid.Col>
              <Grid.Col span={9}>
                <NodeMap></NodeMap>
              </Grid.Col>
              <Grid.Col span={3} h={"25vh"}>
                <SimulationStatistics></SimulationStatistics>
              </Grid.Col>
              <Grid.Col span={9}>
                <DataTransferChart></DataTransferChart>
              </Grid.Col>
            </Grid>
          </Container>
        </AppShell.Main>
      </AppShell>
    </MantineProvider>
  );
}
