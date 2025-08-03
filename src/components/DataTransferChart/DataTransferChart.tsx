import { Container, Paper, Text } from "@mantine/core";
import { listen } from "@tauri-apps/api/event";
import { useEffect, useState } from "react";
import {
  IngestedSize,
  RemoteObjectStoreTableSize,
} from "../../interfaces/event";
import { formatDate } from "../../util";
import { LineChart } from "@mantine/charts";

interface DataBucket {
  timestamp: number;
  ingestedSize: number;
  modelarDbSize: number;
  parquetSize: number;
}

export function DataTransferChart({}) {
  const [bucketedData, setBucketedData] = useState<DataBucket[]>([
    {
      timestamp: Date.now(),
      ingestedSize: 0,
      modelarDbSize: 0,
      parquetSize: 0,
    },
  ]);
  const [ingestedBytes, setIngestedBytes] = useState(0);
  const [modelarDbBytes, setModelarDbBytes] = useState(0);
  const [parquetBytes, setParquetBytes] = useState(0);

  useEffect(() => {
    const bucketInterval = 15000; // 15 seconds
    const maxAge = 300000; // 5 minutes

    const now = Date.now();
    const bucketTime = Math.floor(now / bucketInterval) * bucketInterval;

    // Copy the current bucketed data to avoid mutating state directly.
    const currentBuckets = [...bucketedData];

    // If the last bucket is not the current time, add a new one.
    if (currentBuckets[currentBuckets.length - 1].timestamp !== bucketTime) {
      currentBuckets.push({
        timestamp: bucketTime,
        ingestedSize: ingestedBytes,
        modelarDbSize: modelarDbBytes,
        parquetSize: parquetBytes,
      });
    }

    // Remove old buckets that are older than maxAge
    const filteredBuckets = currentBuckets.filter(
      (bucket) => bucket.timestamp >= now - maxAge
    );

    setBucketedData(filteredBuckets);
  }, [ingestedBytes, modelarDbBytes, parquetBytes]);

  useEffect(() => {
    listen<RemoteObjectStoreTableSize>("remote-object-store-size", (event) => {
      if (event.payload.node_type === "modelardb") {
        setModelarDbBytes(event.payload.table_size);
      } else {
        setParquetBytes(event.payload.table_size);
      }
    });

    listen<IngestedSize>("data-ingested", (event) => {
      setIngestedBytes((prev) => prev + event.payload.size);
    });
  }, []);

  // When the data is fetched, we format it for the chart.
  const formattedBucketedData = bucketedData.map((bucket) => ({
    ...bucket,
    timestamp: formatDate(bucket.timestamp, false),
    ingested_bytes: (bucket.ingestedSize / 1048576).toFixed(2),
    transferred_modelardb_bytes: (bucket.modelarDbSize / 1048576).toFixed(2),
    transferred_parquet_bytes: (bucket.parquetSize / 1048576).toFixed(2),
  }));

  return (
    <Container fluid ps={5} pe={5}>
      <Paper withBorder radius="md" p={5} pb={15} ms={0} pt={5}>
        <Text pos={"relative"} top={20} left={20} fz={22} fw={700} mt={-15}>
          Compression Ratio
        </Text>
        <LineChart
          h={210}
          ps={10}
          pe={10}
          data={formattedBucketedData}
          dataKey="timestamp"
          withLegend
          series={[
            {
              name: "ingested_bytes",
              color: "#e22732",
              label: "Ingested Data",
            },
            {
              name: "transferred_modelardb_bytes",
              color: "#0969ff",
              label: `ModelarDB (${(ingestedBytes / modelarDbBytes).toFixed(2)}x)`,
            },
            {
              name: "transferred_parquet_bytes",
              color: "#7d3fc9",
              label: `Apache Parquet (${(ingestedBytes / parquetBytes).toFixed(2)}x)`,
            },
          ]}
          curveType="linear"
          yAxisProps={{
            min: 0,
            domain: [
              0,
              Math.max(
                10,
                bucketedData[bucketedData.length - 1].ingestedSize / 1048576
              ),
            ],
            tickFormatter: (v: number) => v.toFixed(1),
            label: {
              value: "MB",
              angle: -90,
              position: "insideLeft",
              offset: -4,
            },
          }}
        />
      </Paper>
    </Container>
  );
}
