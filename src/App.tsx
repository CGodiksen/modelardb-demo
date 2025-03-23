import { useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import { AppShell, Container, Grid, MantineProvider } from "@mantine/core";

import { NodeMap } from "./components/NodeMap/NodeMap.tsx";
import { SimulationStatistics } from "./components/SimulationStatistics/SimulationStatistics.tsx";
import { DataTransferChart } from "./components/DataTransferChart/DataTransferChart.tsx";
import { NodeList } from "./components/NodeList/NodeList.tsx";
import { theme } from "./theme";

import "@mantine/core/styles.css";
import "./App.css";

export default function App() {
  useEffect(() => {
    invoke("create_tables", {}).then(() => {
      console.log("Tables created successfully.");
    });

    invoke("ingest_into_tables", {
      losslessCount: 100,
      fiveErrorBoundCount: 200,
      fifteenErrorBoundCount: 300,
    }).then(() => {
      console.log("Started ingesting data into tables.");
    });
  }, []);

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
