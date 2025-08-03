import { Container, Text } from "@mantine/core";
import { ModelardbNode } from "../../interfaces/node";

type NodeGroupProps = {
  type: "modelardb" | "parquet";
  nodes: ModelardbNode[];
};

export function NodeGroup({ type, nodes }: NodeGroupProps) {
  return (
    <Container fluid ps={5} pe={5} style={{ height: "100%" }}>
      <Text size="xl" fw={700}>
        {type.charAt(0).toUpperCase() + type.slice(1)}
      </Text>
      <p>This is a placeholder for the Node Group component.</p>
    </Container>
  );
}
