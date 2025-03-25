import { invoke } from "@tauri-apps/api/core";
import { useHotkeys } from "@mantine/hooks";
import { useEffect, useState } from "react";
import { listen } from "@tauri-apps/api/event";
import { AppShell, Container, Grid, MantineProvider } from "@mantine/core";

import { IngestionControls } from "./components/IngestionControls/IngestionControls.tsx";
import { DataTransferStatistics } from "./components/DataTransferStatistics/DataTransferStatistics.tsx";
import { TableStatistics } from "./components/TableStatistics/TableStatistics.tsx";
import { NodeMap } from "./components/NodeMap/NodeMap.tsx";
import {
  IngestedSize,
  RemoteObjectStoreTableSize,
} from "./interfaces/event.ts";

import { theme } from "./theme";
import "@mantine/core/styles.css";
import "./App.css";

export default function App() {
  const [totalIngestedSize, setTotalIngestedSize] = useState(0);
  const [dataIngestedEvents, setDataIngestedEvents] = useState<IngestedSize[]>(
    [],
  );

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
          tableName: "wind_1",
          count: 100,
        }).then(() => {
          console.log("Started ingesting data into wind_1.");
        });

        invoke("ingest_into_table", {
          tableName: "wind_2",
          count: 200,
        }).then(() => {
          console.log("Started ingesting data into wind_2.");
        });

        invoke("ingest_into_table", {
          tableName: "wind_3",
          count: 300,
        }).then(() => {
          console.log("Started ingesting data into wind_3.");
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

  useHotkeys([
    [
      "ctrl+m",
      () => {
        invoke("monitor_remote_object_stores", {
          intervalSeconds: 5,
        }).then(() => {
          console.log("Started monitoring remote object stores.");
        });
      },
    ],
  ]);

  useEffect(() => {
    listen<RemoteObjectStoreTableSize>("remote-object-store-size", (event) => {
      console.log(
        `Received remote object store size data for ${event.payload.node_type}: \n 
        wind_1: ${event.payload.wind_1_size} \n 
        wind_2: ${event.payload.wind_2_size} \n 
        wind_3: ${event.payload.wind_3_size}`,
      );
    });

    listen<IngestedSize>("data-ingested", (event) => {
      setTotalIngestedSize((prev) => prev + event.payload.size);
      setDataIngestedEvents((prev) => [...prev, event.payload]);
    });
  }, []);

  return (
    <MantineProvider defaultColorScheme="dark" theme={theme}>
      <AppShell padding="sm">
        <AppShell.Main>
          <Container m={5} p={5} fluid>
            <Grid columns={24} grow>
              <Grid.Col span={6} h={"23vh"}>
                <IngestionControls></IngestionControls>
              </Grid.Col>
              <Grid.Col span={9}>
                <DataTransferStatistics
                  deployment={"modelardb"}
                ></DataTransferStatistics>
              </Grid.Col>
              <Grid.Col span={9}>
                <DataTransferStatistics
                  deployment={"parquet"}
                ></DataTransferStatistics>
              </Grid.Col>
              <Grid.Col span={6} h={"74vh"}>
                <Grid grow>
                  <Grid.Col span={12} h={"24vh"}>
                    <TableStatistics
                      description={"Total data ingested for both deployments"}
                      colors={["#ec777e", "#e22732", "#9e0419"]}
                    ></TableStatistics>
                  </Grid.Col>
                  <Grid.Col span={12} h={"24vh"}>
                    <TableStatistics
                      description={"Total data transferred for ModelarDB"}
                      colors={["#64a0ff", "#0969ff", "#0043b5"]}
                    ></TableStatistics>
                  </Grid.Col>
                  <Grid.Col span={12}>
                    <TableStatistics
                      description={"Total data transferred for Parquet"}
                      colors={["#ad86dd", "#7d3fc9", "#52238d"]}
                    ></TableStatistics>
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
