import { Container, Paper, Text } from "@mantine/core";
import { BarChart } from "@mantine/charts";

import { BucketedData } from "../../interfaces/event.ts";
import { formatDate } from "../../util.ts";

type DataTransferStatisticsProps = {
  deployment: string;
  bucketedData: BucketedData[];
  colors: string[];
};

export function DataTransferStatistics({
  deployment,
  bucketedData,
  colors,
}: DataTransferStatisticsProps) {
  const formattedBucketedData = bucketedData.map((bucket) => ({
    ...bucket,
    timestamp: formatDate(bucket.timestamp, false),
    ingested_bytes: (bucket.ingested_bytes / 1048576).toFixed(2),
    transferred_bytes: (bucket.transferred_bytes / 1048576).toFixed(2),
  }));

  function calculateCompressionRatio(bucketedData: BucketedData[]): number {
    const totalIngestedBytes = bucketedData.reduce(
      (sum, bucket) => sum + bucket.ingested_bytes,
      0,
    );
    const totalTransferredBytes = bucketedData.reduce(
      (sum, bucket) => sum + bucket.transferred_bytes,
      0,
    );

    if (totalIngestedBytes === 0) return 0;

    return totalIngestedBytes / totalTransferredBytes;
  }

  return (
    <Container fluid ps={5} pe={5}>
      <Paper withBorder radius="md" p={10} pb={15} ms={0} pt={5}>
        <Text fz="xl" fw={700}>
          {calculateCompressionRatio(bucketedData).toFixed(2)}x
        </Text>
        <Text c="dimmed" fz="sm">
          Total compression ratio for {deployment} in the last 2 minutes
        </Text>

        <BarChart
          h={150}
          pt={10}
          data={formattedBucketedData}
          dataKey="timestamp"
          series={[
            {
              name: "ingested_bytes",
              color: colors[0],
              label: "Ingested MB",
            },
            {
              name: "transferred_bytes",
              color: colors[1],
              label: "Transferred MB",
            },
          ]}
          tickLine="y"
          yAxisProps={{ domain: [0, 50] }}
        />
      </Paper>
    </Container>
  );
}
