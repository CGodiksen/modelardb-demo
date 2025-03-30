import { IconDeviceAnalytics } from "@tabler/icons-react";
import { Box, Group, Paper, Progress, SimpleGrid, Text } from "@mantine/core";

import { tables } from "../../data/tables.ts";
import classes from "./TableStatistics.module.css";
import { formatBytes } from "../../util.ts";

type TableStatisticsProps = {
  description: string;
  colors: string[];
  table_1_bytes: number;
  table_2_bytes: number;
  table_3_bytes: number;
  show_error_bound: boolean;
  lossless: boolean;
};

export function TableStatistics({
  description,
  colors,
  table_1_bytes,
  table_2_bytes,
  table_3_bytes,
  show_error_bound,
  lossless,
}: TableStatisticsProps) {
  const total_bytes = table_1_bytes + table_2_bytes + table_3_bytes;
  const data = [
    {
      label: tables[0].name,
      count: table_1_bytes,
      part: Math.round((table_1_bytes / total_bytes) * 100),
      color: colors[0],
      error_bound: lossless ? "lossless" : tables[0].error_bound,
    },
    {
      label: tables[1].name,
      count: table_2_bytes,
      part: Math.round((table_2_bytes / total_bytes) * 100),
      color: colors[1],
      error_bound: lossless ? "lossless" : tables[1].error_bound,
    },
    {
      label: tables[2].name,
      count: table_3_bytes,
      part: Math.round((table_3_bytes / total_bytes) * 100),
      color: colors[2],
      error_bound: lossless ? "lossless" : tables[2].error_bound,
    },
  ];

  const segments = data.map((segment) => (
    <Progress.Section
      value={segment.part}
      color={segment.color}
      key={segment.color}
    >
      {segment.part > 10 && <Progress.Label>{segment.part}%</Progress.Label>}
    </Progress.Section>
  ));

  const descriptions = data.map((stat) => (
    <Box
      key={stat.label}
      style={{ borderBottomColor: stat.color }}
      className={classes.stat}
    >
      <Text tt="uppercase" fz="xs" c="dimmed" fw={700}>
        {stat.label} {show_error_bound ? `(${stat.error_bound})` : ""}
      </Text>

      <Group justify="space-between" align="flex-end" gap={0}>
        <Text fw={700}>{formatBytes(stat.count, 2)}</Text>
        <Text c={stat.color} fw={700} size="sm" className={classes.statCount}>
          {stat.part}%
        </Text>
      </Group>
    </Box>
  ));

  return (
    <Paper withBorder radius="md" p={10} mb={10} pb={15} mt={5}>
      <Group justify="space-between">
        <Group align="flex-end" gap="xs">
          <Text fz="xl" fw={700}>
            {formatBytes(total_bytes, 2)}
          </Text>
        </Group>
        <IconDeviceAnalytics size={22} className={classes.icon} stroke={1.5} />
      </Group>

      <Text c="dimmed" fz="sm">
        {description}
      </Text>

      <Progress.Root
        size={34}
        classNames={{ label: classes.progressLabel }}
        mt={40}
      >
        {segments}
      </Progress.Root>
      <SimpleGrid cols={{ base: 1, xs: 3 }} mt="xl">
        {descriptions}
      </SimpleGrid>
    </Paper>
  );
}
