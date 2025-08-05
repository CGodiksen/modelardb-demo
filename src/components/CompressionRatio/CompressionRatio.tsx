import { Container, Group, Paper, Text } from "@mantine/core";

type CompressionRatioProps = {
  ratio: number;
  type: string;
};

export function CompressionRatio({ ratio, type }: CompressionRatioProps) {
  return (
    <Container fluid>
      <Paper withBorder radius="md" p={10}>
        <Group justify="apart">
          <div>
            <Text c="dimmed" tt="uppercase" fw={700} fz="xs">
              Compression ratio
            </Text>
            <Text fw={700} fz="25px" mt={5}>
              {ratio}x
            </Text>
          </div>
        </Group>
        <Text c="dimmed" fz="sm">
          {type}
        </Text>
      </Paper>
    </Container>
  );
}
