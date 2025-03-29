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
import { tables } from "./data/tables.ts";

export default function App() {
  const [bucketedModelardbData, setBucketedModelardbData] = useState<
    BucketedData[]
  >([]);
  const [bucketedParquetData, setBucketedParquetData] = useState<
    BucketedData[]
  >([]);

  const [totalIngestedTable1Size, setTotalIngestedTable1Size] = useState(0);
  const [totalIngestedTable2Size, setTotalIngestedTable2Size] = useState(0);
  const [totalIngestedTable3Size, setTotalIngestedTable3Size] = useState(0);

  const [totalTransferredSizeModelardb, setTotalTransferredSizeModelardb] =
    useState<RemoteObjectStoreTableSize>({
      node_type: "modelardb",
      table_1_size: 0,
      table_2_size: 0,
      table_3_size: 0,
    });

  const [totalTransferredSizeParquet, setTotalTransferredSizeParquet] =
    useState<RemoteObjectStoreTableSize>({
      node_type: "parquet",
      table_1_size: 0,
      table_2_size: 0,
      table_3_size: 0,
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
          const changeInSizeTable1 =
            event.payload.table_1_size - prev.table_1_size;
          const changeInSizeTable2 =
            event.payload.table_2_size - prev.table_2_size;
          const changeInSizeTable3 =
            event.payload.table_3_size - prev.table_3_size;
          setBucketedModelardbData((prevData) => {
            return updateBucketedData(
              prevData,
              0,
              changeInSizeTable1 + changeInSizeTable2 + changeInSizeTable3,
            );
          });
          return event.payload;
        });
      } else {
        setTotalTransferredSizeParquet((prev) => {
          const changeInSizeTable1 =
            event.payload.table_1_size - prev.table_1_size;
          const changeInSizeTable2 =
            event.payload.table_2_size - prev.table_2_size;
          const changeInSizeTable3 =
            event.payload.table_3_size - prev.table_3_size;
          setBucketedParquetData((prevData) => {
            return updateBucketedData(
              prevData,
              0,
              changeInSizeTable1 + changeInSizeTable2 + changeInSizeTable3,
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

      if (event.payload.table_name === tables[0].name) {
        setTotalIngestedTable1Size((prev) => prev + event.payload.size);
      } else if (event.payload.table_name === tables[1].name) {
        setTotalIngestedTable2Size((prev) => prev + event.payload.size);
      } else {
        setTotalIngestedTable3Size((prev) => prev + event.payload.size);
      }
    });
  }, []);

  return (
    <MantineProvider defaultColorScheme="dark" theme={theme}>
      <AppShell padding="sm">
        <AppShell.Main pb={0} pe={5}>
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
                  deployment={"Apache Parquet"}
                  colors={["#7d3fc9", "#52238d"]}
                ></DataTransferStatistics>
              </Grid.Col>
              <Grid.Col span={6} h={"74vh"}>
                <Grid grow>
                  <Grid.Col span={12} h={"24vh"}>
                    <TableStatistics
                      description={
                        "Total uncompressed data ingested for both deployments"
                      }
                      colors={["#ec777e", "#e22732", "#9e0419"]}
                      table_1_bytes={totalIngestedTable1Size}
                      table_2_bytes={totalIngestedTable2Size}
                      table_3_bytes={totalIngestedTable3Size}
                      show_error_bound={false}
                      lossless={false}
                    ></TableStatistics>
                  </Grid.Col>
                  <Grid.Col span={12} h={"24vh"}>
                    <TableStatistics
                      description={
                        "Total compressed data transferred for ModelarDB"
                      }
                      colors={["#64a0ff", "#0969ff", "#0043b5"]}
                      table_1_bytes={totalTransferredSizeModelardb.table_1_size}
                      table_2_bytes={totalTransferredSizeModelardb.table_2_size}
                      table_3_bytes={totalTransferredSizeModelardb.table_3_size}
                      show_error_bound={true}
                      lossless={false}
                    ></TableStatistics>
                  </Grid.Col>
                  <Grid.Col span={12}>
                    <TableStatistics
                      description={
                        "Total compressed data transferred for Apache Parquet"
                      }
                      colors={["#ad86dd", "#7d3fc9", "#52238d"]}
                      table_1_bytes={totalTransferredSizeParquet.table_1_size}
                      table_2_bytes={totalTransferredSizeParquet.table_2_size}
                      table_3_bytes={totalTransferredSizeParquet.table_3_size}
                      show_error_bound={true}
                      lossless={true}
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
