import { IconDeviceAnalytics } from "@tabler/icons-react";
import { Box, Group, Paper, Progress, SimpleGrid, Text } from "@mantine/core";

import classes from "./TableStatistics.module.css";

type TableStatisticsProps = {
  description: string;
  colors: string[];
  wind_1_bytes: number;
  wind_2_bytes: number;
  wind_3_bytes: number;
};

export function TableStatistics({
  description,
  colors,
  wind_1_bytes,
  wind_2_bytes,
  wind_3_bytes,
}: TableStatisticsProps) {
  const total_bytes = wind_1_bytes + wind_2_bytes + wind_3_bytes;
  const data = [
    {
      label: "wind_1",
      count: wind_1_bytes,
      part: Math.round((wind_1_bytes / total_bytes) * 100),
      color: colors[0],
    },
    {
      label: "wind_2",
      count: wind_2_bytes,
      part: Math.round((wind_2_bytes / total_bytes) * 100),
      color: colors[1],
    },
    {
      label: "wind_3",
      count: wind_3_bytes,
      part: Math.round((wind_3_bytes / total_bytes) * 100),
      color: colors[2],
    },
  ];

  function bytesToMegabytes(bytes: number): string {
    const megabytes = bytes / 1048576;
    return `${megabytes.toFixed(2)} MB`;
  }

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
        {stat.label}
      </Text>

      <Group justify="space-between" align="flex-end" gap={0}>
        <Text fw={700}>{bytesToMegabytes(stat.count)}</Text>
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
            {bytesToMegabytes(total_bytes)}
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
