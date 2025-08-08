import { Container, Paper } from "@mantine/core";
import { listen } from "@tauri-apps/api/event";
import { useEffect, useState } from "react";
import {
  IngestedSize,
  RemoteObjectStoreTableSize,
} from "../../interfaces/event";
import { formatDate } from "../../util";
import { LineChart } from "@mantine/charts";
import { COMPARISON_SYSTEM_COLOR, MODELARDB_COLOR } from "../../constants";
import { ComparisonSystem } from "../../interfaces/system";

type DataTransferChartProps = {
  ingestedBytes: number;
  setIngestedBytes: React.Dispatch<React.SetStateAction<number>>;
  modelarDbBytes: number;
  setModelarDbBytes: React.Dispatch<React.SetStateAction<number>>;
  comparisonSystemBytes: number;
  setComparisonSystemBytes: React.Dispatch<React.SetStateAction<number>>;
  comparisonSystem: ComparisonSystem;
};

interface DataBucket {
  timestamp: number;
  ingestedSize: number;
  modelarDbSize: number;
  comparisonSystemSize: number;
}

export function DataTransferChart({
  ingestedBytes,
  setIngestedBytes,
  modelarDbBytes,
  setModelarDbBytes,
  comparisonSystemBytes,
  setComparisonSystemBytes,
  comparisonSystem,
}: DataTransferChartProps) {
  const [bucketedData, setBucketedData] = useState<DataBucket[]>([
    {
      timestamp: Date.now(),
      ingestedSize: 0,
      modelarDbSize: 0,
      comparisonSystemSize: 0,
    },
  ]);

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
        comparisonSystemSize: comparisonSystemBytes,
      });
    }

    // Remove old buckets that are older than maxAge
    const filteredBuckets = currentBuckets.filter(
      (bucket) => bucket.timestamp >= now - maxAge
    );

    setBucketedData(filteredBuckets);
  }, [ingestedBytes, modelarDbBytes, comparisonSystemBytes]);

  useEffect(() => {
    listen<RemoteObjectStoreTableSize>("remote-object-store-size", (event) => {
      if (event.payload.node_type === "modelardb") {
        setModelarDbBytes(event.payload.table_size);
      } else {
        setComparisonSystemBytes(event.payload.table_size);
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
    transferred_comparison_system_bytes: (
      bucket.comparisonSystemSize / 1048576
    ).toFixed(2),
  }));

  return (
    <Container fluid ps={5} pe={5}>
      <Paper withBorder radius="md" p={5} pb={15} ms={0} pt={5}>
        <LineChart
          h={210}
          ps={10}
          pe={10}
          mt={10}
          data={formattedBucketedData}
          dataKey="timestamp"
          withLegend
          series={[
            {
              name: "ingested_bytes",
              color: "#FFC107",
              label: "Ingested Data",
            },
            {
              name: "transferred_modelardb_bytes",
              color: MODELARDB_COLOR,
              label: `ModelarDB`,
            },
            {
              name: "transferred_comparison_system_bytes",
              color: COMPARISON_SYSTEM_COLOR,
              label: comparisonSystem.label,
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
