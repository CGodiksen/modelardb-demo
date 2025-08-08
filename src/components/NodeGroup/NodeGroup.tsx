import { ActionIcon, Container, Grid, Group, Text } from "@mantine/core";
import { ModelardbNode } from "../../interfaces/node";
import { NodeDetail } from "../NodeDetail/NodeDetail";
import { IconSettings } from "@tabler/icons-react";
import { COMPARISON_SYSTEM_COLOR, MODELARDB_COLOR } from "../../constants";

type NodeGroupProps = {
  type: "ModelarDB" | "Apache Parquet" | "Apache TsFile";
  nodes: ModelardbNode[];
  openConfigurationModal: () => void;
};

export function NodeGroup({
  type,
  nodes,
  openConfigurationModal,
}: NodeGroupProps) {
  const color = type == "ModelarDB" ? MODELARDB_COLOR : COMPARISON_SYSTEM_COLOR;

  return (
    <Container fluid ps={5} pe={5} style={{ height: "100%" }}>
      <Group justify="space-between">
        <Text fz={22} fw={700}>
          {type}
        </Text>
        <ActionIcon
          aria-label="Settings"
          m={5}
          color={color}
          onClick={openConfigurationModal}
        >
          <IconSettings style={{ width: "100%", height: "70%" }} stroke={1.5} />
        </ActionIcon>
      </Group>

      <Grid>
        {nodes.map((node, idx) => (
          <Grid.Col key={idx} span={6}>
            <NodeDetail node={node} color={color} />
          </Grid.Col>
        ))}
      </Grid>
    </Container>
  );
}
