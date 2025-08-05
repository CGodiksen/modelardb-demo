import { Group, ThemeIcon } from "@mantine/core";
import { IconWindmill } from "@tabler/icons-react";
import { MODELARDB_COLOR, COMPARISON_SYSTEM_COLOR } from "../../constants";

type SystemTypeIconProps = {
  type: "ModelarDB" | "Apache Parquet" | "All";
  marginTop: number;
};

export function SystemTypeIcon({ type, marginTop }: SystemTypeIconProps) {
  const color =
    type === "ModelarDB" ? MODELARDB_COLOR : COMPARISON_SYSTEM_COLOR;

  if (type === "All") {
    return (
      <Group gap={10}>
        <ThemeIcon size={25} radius={50} color={MODELARDB_COLOR} mt={marginTop}>
          <IconWindmill size={25} stroke={1.5} />
        </ThemeIcon>
        <ThemeIcon
          size={25}
          radius={50}
          color={COMPARISON_SYSTEM_COLOR}
          mt={-25}
        >
          <IconWindmill size={25} stroke={1.5} />
        </ThemeIcon>
      </Group>
    );
  } else {
    return (
      <ThemeIcon size={25} radius={50} color={color} mt={marginTop}>
        <IconWindmill size={25} stroke={1.5} />
      </ThemeIcon>
    );
  }
}
