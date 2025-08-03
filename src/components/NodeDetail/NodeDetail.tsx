import { Paper, ThemeIcon, Text, Group } from "@mantine/core";
import { IconDeviceAnalytics, IconWindmill } from "@tabler/icons-react";
import { ModelardbNode } from "../../interfaces/node";
import { Sparkline } from "@mantine/charts";
import classes from "./NodeDetail.module.css";

export function NodeDetail({ node }: { node: ModelardbNode }) {
  const color = node.type == "modelardb" ? "#0969ff" : "#7d3fc9";

  return (
    <Paper
      radius="md"
      withBorder
      className={classes.card}
      mt={20}
      p={10}
      pb={15}
    >
      <ThemeIcon className={classes.icon} size={40} radius={40} color={color}>
        <IconWindmill size={32} stroke={1.5} />
      </ThemeIcon>

      <Group justify="space-between" mt={-45} mb={10}>
        <Text size="xs" c="dimmed" fw={700}>
          {node.url!.replace(/^grpc:\/\//, "")}
        </Text>
        <IconDeviceAnalytics
          className={classes.node_icon}
          size={22}
          stroke={1.5}
        />
      </Group>

      <Group align="flex-end" gap="xs" mt={20} me={0} pe={0}>
        <Text w={90} fz={24} fw={700}>
          {Math.floor(Math.random() * 200) + 1} MB
        </Text>

        <Sparkline
          w={130}
          h={40}
          data={Array.from({ length: 7 }, () => Math.floor(Math.random() * 51))}
          curveType="linear"
          color={color}
          fillOpacity={0.6}
          strokeWidth={2}
        />
      </Group>

      <Text fz="xs" c="dimmed" mt={0}>
        Data to transfer
      </Text>
    </Paper>
  );
}
