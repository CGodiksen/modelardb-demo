import { Paper, Group, Text } from "@mantine/core";

type ConfigurationSettingProps = {
  title: string;
  value: string;
  type: string;
};

export function ConfigurationSetting({
  title,
  value,
  type,
}: ConfigurationSettingProps) {
  return (
    <Paper withBorder radius="md" p={10}>
      <Group justify="apart">
        <div>
          <Text c="dimmed" tt="uppercase" fw={700} fz="xs">
            {title}
          </Text>
          <Text fw={700} fz="xl">
            {value}
          </Text>
        </div>
      </Group>
      <Text c="dimmed" fz="sm" mt={5}>
        {type}
      </Text>
    </Paper>
  );
}
