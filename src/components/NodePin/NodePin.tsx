import { ActionIcon } from "@mantine/core";
import { IconCloud, IconUser, IconWindmill } from "@tabler/icons-react";

import { ModelardbNode } from "../../interfaces/node.ts";

export function NodePin({ node }: { node: ModelardbNode }) {
  if (node.server_mode == "edge") {
    return (
      <ActionIcon variant="filled" radius={"lg"}>
        <IconWindmill stroke={1.75} />
      </ActionIcon>
    );
  } else if (node.server_mode == "cloud") {
    return (
      <ActionIcon variant="filled" radius={"lg"}>
        <IconCloud stroke={1.75} />
      </ActionIcon>
    );
  } else if (node.server_mode == "local") {
    return (
      <ActionIcon variant="filled" radius={"lg"}>
        <IconUser stroke={1.75} />
      </ActionIcon>
    );
  }
}
