import { Paper, Group, Text } from "@mantine/core";
import { SystemTypeIcon } from "../SystemTypeIcon/SystemTypeIcon";

type ConfigurationSettingProps = {
  title: string;
  value: string;
  type: "ModelarDB" | "Apache Parquet" | "Apache ORC" | "All";
};

export function ConfigurationSetting({
  title,
  value,
  type,
}: ConfigurationSettingProps) {
  return (
    <Paper withBorder radius="md" p={10}>
      <Group justify="space-between">
        <div>
          <Text c="dimmed" tt="uppercase" fw={700} fz="xs">
            {title}
          </Text>
          <Text fw={700} fz="xl">
            {value}
          </Text>
        </div>

        <SystemTypeIcon type={type} marginTop={-25}></SystemTypeIcon>
      </Group>
      <Text c="dimmed" fz="sm" mt={5}>
        {type} nodes
      </Text>
    </Paper>
  );
}
