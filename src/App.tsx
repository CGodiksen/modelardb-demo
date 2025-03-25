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
  BucketedData,
  IngestedSize,
  RemoteObjectStoreTableSize,
} from "./interfaces/event.ts";

import { theme } from "./theme";
import "@mantine/core/styles.css";
import "./App.css";

export default function App() {
  const [bucketedModelardbData, setBucketedModelardbData] = useState<
    BucketedData[]
  >([]);
  const [bucketedParquetData, setBucketedParquetData] = useState<
    BucketedData[]
  >([]);

  const [totalIngestedWind1Size, setTotalIngestedWind1Size] = useState(0);
  const [totalIngestedWind2Size, setTotalIngestedWind2Size] = useState(0);
  const [totalIngestedWind3Size, setTotalIngestedWind3Size] = useState(0);

  const [totalTransferredSizeModelardb, setTotalTransferredSizeModelardb] =
    useState<RemoteObjectStoreTableSize>({
      node_type: "modelardb",
      wind_1_size: 0,
      wind_2_size: 0,
      wind_3_size: 0,
    });

  const [totalTransferredSizeParquet, setTotalTransferredSizeParquet] =
    useState<RemoteObjectStoreTableSize>({
      node_type: "parquet",
      wind_1_size: 0,
      wind_2_size: 0,
      wind_3_size: 0,
    });

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

  function updateBucketedData(
    bucketedData: BucketedData[],
    ingestedBytes: number,
    transferredBytes: number,
  ): BucketedData[] {
    const bucketInterval = 15000; // 15 seconds
    const maxAge = 120000; // 2 minutes

    const now = Date.now();
    const bucketTime = Math.floor(now / bucketInterval) * bucketInterval;

    const existingBucket = bucketedData.find(
      (bucket) => bucket.timestamp === bucketTime,
    );

    if (existingBucket) {
      existingBucket.ingested_bytes += ingestedBytes;
      existingBucket.transferred_bytes += transferredBytes;
    } else {
      bucketedData.push({
        timestamp: bucketTime,
        ingested_bytes: ingestedBytes,
        transferred_bytes: transferredBytes,
      });
    }

    return bucketedData.filter((bucket) => now - bucket.timestamp <= maxAge);
  }

  useEffect(() => {
    listen<RemoteObjectStoreTableSize>("remote-object-store-size", (event) => {
      if (event.payload.node_type === "modelardb") {
        setTotalTransferredSizeModelardb((prev) => {
          const changeInSizeWind1 =
            event.payload.wind_1_size - prev.wind_1_size;
          const changeInSizeWind2 =
            event.payload.wind_2_size - prev.wind_2_size;
          const changeInSizeWind3 =
            event.payload.wind_3_size - prev.wind_3_size;
          setBucketedModelardbData((prevData) => {
            return updateBucketedData(
              prevData,
              0,
              changeInSizeWind1 + changeInSizeWind2 + changeInSizeWind3,
            );
          });
          return event.payload;
        });
      } else {
        setTotalTransferredSizeParquet((prev) => {
          const changeInSizeWind1 =
            event.payload.wind_1_size - prev.wind_1_size;
          const changeInSizeWind2 =
            event.payload.wind_2_size - prev.wind_2_size;
          const changeInSizeWind3 =
            event.payload.wind_3_size - prev.wind_3_size;
          setBucketedParquetData((prevData) => {
            return updateBucketedData(
              prevData,
              0,
              changeInSizeWind1 + changeInSizeWind2 + changeInSizeWind3,
            );
          });
          return event.payload;
        });
      }
    });

    listen<IngestedSize>("data-ingested", (event) => {
      setBucketedModelardbData((prevData) => {
        return updateBucketedData(prevData, event.payload.size, 0);
      });

      setBucketedParquetData((prevData) => {
        return updateBucketedData(prevData, event.payload.size, 0);
      });

      if (event.payload.table_name === "wind_1") {
        setTotalIngestedWind1Size((prev) => prev + event.payload.size);
      } else if (event.payload.table_name === "wind_2") {
        setTotalIngestedWind2Size((prev) => prev + event.payload.size);
      } else {
        setTotalIngestedWind3Size((prev) => prev + event.payload.size);
      }
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
                  bucketedData={bucketedModelardbData}
                  deployment={"ModelarDB"}
                  colors={["#0969ff", "#0043b5"]}
                ></DataTransferStatistics>
              </Grid.Col>
              <Grid.Col span={9}>
                <DataTransferStatistics
                  bucketedData={bucketedParquetData}
                  deployment={"Parquet"}
                  colors={["#7d3fc9", "#52238d"]}
                ></DataTransferStatistics>
              </Grid.Col>
              <Grid.Col span={6} h={"74vh"}>
                <Grid grow>
                  <Grid.Col span={12} h={"24vh"}>
                    <TableStatistics
                      description={"Total data ingested for both deployments"}
                      colors={["#ec777e", "#e22732", "#9e0419"]}
                      wind_1_bytes={totalIngestedWind1Size}
                      wind_2_bytes={totalIngestedWind2Size}
                      wind_3_bytes={totalIngestedWind3Size}
                    ></TableStatistics>
                  </Grid.Col>
                  <Grid.Col span={12} h={"24vh"}>
                    <TableStatistics
                      description={"Total data transferred for ModelarDB"}
                      colors={["#64a0ff", "#0969ff", "#0043b5"]}
                      wind_1_bytes={totalTransferredSizeModelardb.wind_1_size}
                      wind_2_bytes={totalTransferredSizeModelardb.wind_2_size}
                      wind_3_bytes={totalTransferredSizeModelardb.wind_3_size}
                    ></TableStatistics>
                  </Grid.Col>
                  <Grid.Col span={12}>
                    <TableStatistics
                      description={"Total data transferred for Parquet"}
                      colors={["#ad86dd", "#7d3fc9", "#52238d"]}
                      wind_1_bytes={totalTransferredSizeParquet.wind_1_size}
                      wind_2_bytes={totalTransferredSizeParquet.wind_2_size}
                      wind_3_bytes={totalTransferredSizeParquet.wind_3_size}
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
