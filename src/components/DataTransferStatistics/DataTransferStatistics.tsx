import { Container, Paper, Text } from "@mantine/core";
import { BarChart } from "@mantine/charts";
import { BucketedData } from "../../interfaces/event.ts";

type DataTransferStatisticsProps = {
  deployment: string;
  bucketedData: BucketedData[];
};

export function DataTransferStatistics({
  deployment,
  bucketedData,
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

  return (
    <Container fluid ps={5} pe={5}>
      <Paper withBorder radius="md" p={10} pb={15} ms={0}>
        <Text fz="xl" fw={700}>
          80%
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
              color: "violet.6",
              label: "Ingested bytes",
            },
          ]}
          tickLine="y"
        />
      </Paper>
    </Container>
  );
}
