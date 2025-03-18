import { AppShell, Container, Grid, MantineProvider } from "@mantine/core";

import { theme } from "./theme";
import { SimulationControls } from "./components/SimulationControls/SimulationControls.tsx";
import { NodeMap } from "./components/NodeMap/NodeMap.tsx";
import { NodeDonutChart } from "./components/NodeDonutChart/NodeDonutChart.tsx";
import { SimulationStatistics } from "./components/SimulationStatistics/SimulationStatistics.tsx";
import { DataTransferChart } from "./components/DataTransferChart/DataTransferChart.tsx";

import "@mantine/core/styles.css";
import "./App.css";

export default function App() {
  return (
    <MantineProvider defaultColorScheme="dark" theme={theme}>
      <AppShell padding="sm">
        <AppShell.Main>
          <Container m={5} p={5} fluid>
            <Grid grow>
              <Grid.Col span={3} h={"72vh"}>
                <SimulationControls></SimulationControls>
              </Grid.Col>
              <Grid.Col span={9}>
                <NodeMap></NodeMap>
              </Grid.Col>
              <Grid.Col span={3} h={"25vh"}>
                <SimulationStatistics></SimulationStatistics>
              </Grid.Col>
              <Grid.Col span={2}>
                <NodeDonutChart></NodeDonutChart>
              </Grid.Col>
              <Grid.Col span={7}>
                <DataTransferChart></DataTransferChart>
              </Grid.Col>
            </Grid>
          </Container>
        </AppShell.Main>
      </AppShell>
    </MantineProvider>
  );
}
