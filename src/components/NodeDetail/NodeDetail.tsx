import { Paper, ThemeIcon, Text, Group } from "@mantine/core";
import { IconDeviceAnalytics, IconWindmill } from "@tabler/icons-react";
import { ModelardbNode } from "../../interfaces/node";
import { Sparkline } from "@mantine/charts";
import { listen } from "@tauri-apps/api/event";
import { useEffect, useState } from "react";
import classes from "./NodeDetail.module.css";

type NodeDetailProps = {
  node: ModelardbNode;
  color: string;
  resetKey: number;
};

export function NodeDetail({ node, color, resetKey }: NodeDetailProps) {
  const [currentSize, setCurrentSize] = useState<number>(0);
  const [nodeSizes, setNodeSizes] = useState<number[]>([0, 0, 0, 0, 0, 0, 0]);

  useEffect(() => {
    const nodePort = node.url!.split(":").pop();
    const nodeType = node.type === "modelardb" ? "modelardb" : "comparison";

    listen<number>(`${nodeType}-${nodePort}-node-size`, (event) => {
      let size_mb = Math.round((event.payload / 1048576) * 10) / 10;

      setCurrentSize(size_mb);
      setNodeSizes((prev) => [...prev.slice(1), event.payload]);
    });
  }, []);

  useEffect(() => {
    setCurrentSize(0);
    setNodeSizes([0, 0, 0, 0, 0, 0, 0]);
  }, [resetKey]);

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
        <IconWindmill size={30} stroke={1.5} />
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
        <Text w={90} fz={22} fw={700}>
          {currentSize} MB
        </Text>

        <Sparkline
          w={130}
          h={40}
          data={nodeSizes}
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
