import { Container, Group, Paper, Text } from "@mantine/core";
import { SystemTypeIcon } from "../SystemTypeIcon/SystemTypeIcon";

type CompressionRatioProps = {
  ratio: number;
  type: "ModelarDB" | "Apache Parquet" | "Apache ORC" | "All";
};

export function CompressionRatio({ ratio, type }: CompressionRatioProps) {
  return (
    <Container fluid>
      <Paper withBorder radius="md" p={10}>
        <Group justify="space-between">
          <div>
            <Text c="dimmed" tt="uppercase" fw={700} fz="xs">
              Compression ratio
            </Text>
            <Text fw={700} fz="25px" mt={5}>
              {ratio.toFixed(2)}x
            </Text>
          </div>

          <SystemTypeIcon type={type} marginTop={-40}></SystemTypeIcon>
        </Group>
        <Text c="dimmed" fz="sm">
          {type}
        </Text>
      </Paper>
    </Container>
  );
}
