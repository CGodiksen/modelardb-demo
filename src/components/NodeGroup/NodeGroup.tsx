import {
  ActionIcon,
  Container,
  Grid,
  Group,
  Modal,
  Text,
  Title,
} from "@mantine/core";
import { ModelardbNode } from "../../interfaces/node";
import { NodeDetail } from "../NodeDetail/NodeDetail";
import { IconSettings } from "@tabler/icons-react";
import { useDisclosure } from "@mantine/hooks";
import { ConfigurationModal } from "../ConfigurationModal/ConfigurationModal";

type NodeGroupProps = {
  type: "modelardb" | "parquet";
  nodes: ModelardbNode[];
};

export function NodeGroup({ type, nodes }: NodeGroupProps) {
  const [opened, { open, close }] = useDisclosure(false);
  const color = nodes[0]?.type == "modelardb" ? "#0969ff" : "#7d3fc9";

  return (
    <>
      <Modal
        opened={opened}
        onClose={close}
        title={<Title order={3}>Simulation Configuration</Title>}
        size={"30%"}
        centered={true}
      >
        <ConfigurationModal close={close} />
      </Modal>

      <Container fluid ps={5} pe={5} style={{ height: "100%" }}>
        <Group justify="space-between">
          <Text fz={22} fw={700}>
            {type.charAt(0).toUpperCase() + type.slice(1)}
          </Text>
          <ActionIcon aria-label="Settings" m={5} color={color} onClick={open}>
            <IconSettings
              style={{ width: "70%", height: "70%" }}
              stroke={1.5}
            />
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
    </>
  );
}
