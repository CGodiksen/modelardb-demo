import { Container, Grid, Text } from "@mantine/core";
import { ModelardbNode } from "../../interfaces/node";
import { NodeDetail } from "../NodeDetail/NodeDetail";

type NodeGroupProps = {
  type: "modelardb" | "parquet";
  nodes: ModelardbNode[];
};

export function NodeGroup({ type, nodes }: NodeGroupProps) {
  return (
    <Container fluid ps={5} pe={5} style={{ height: "100%" }}>
      <Text fz={22} fw={700}>
        {type.charAt(0).toUpperCase() + type.slice(1)}
      </Text>

      <Grid>
        {nodes.map((node, idx) => (
          <Grid.Col key={idx} span={6}>
            <NodeDetail node={node} />
          </Grid.Col>
        ))}
      </Grid>
    </Container>
  );
}
