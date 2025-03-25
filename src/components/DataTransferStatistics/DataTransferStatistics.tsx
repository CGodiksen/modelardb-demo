import { Container, Paper, Text } from "@mantine/core";
import { BarChart } from "@mantine/charts";
import { BucketedData } from "../../interfaces/event.ts";

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
  function formatDate(timestamp: number): string {
    const date = new Date(timestamp);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");
    const seconds = String(date.getSeconds()).padStart(2, "0");
    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
  }

  const formattedBucketedData = bucketedData.map((bucket) => ({
    ...bucket,
    timestamp: formatDate(bucket.timestamp),
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

    return (1 - totalTransferredBytes / totalIngestedBytes) * 100;
  }

  return (
    <Container fluid ps={5} pe={5}>
      <Paper withBorder radius="md" p={10} pb={15} ms={0}>
        <Text fz="xl" fw={700}>
          {calculateCompressionRatio(bucketedData).toFixed(2)}%
        </Text>
        <Text c="dimmed" fz="sm">
          Compression ratio for {deployment} in the last 2 minutes
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
              label: "Ingested bytes",
            },
            {
              name: "transferred_bytes",
              color: colors[1],
              label: "Transferred bytes",
            },
          ]}
          tickLine="y"
        />
      </Paper>
    </Container>
  );
}
