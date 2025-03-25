import { ActionIcon } from "@mantine/core";
import { IconCloud, IconUser, IconWindmill } from "@tabler/icons-react";

import { ModelardbNode } from "../../interfaces/node.ts";

export function NodePin({ node }: { node: ModelardbNode }) {
  const color = node.type == "modelardb" ? "#0969ff" : "#7d3fc9";

  if (node.server_mode == "edge") {
    return (
      <ActionIcon variant="filled" radius={"lg"} color={color}>
        <IconWindmill stroke={1.75} />
      </ActionIcon>
    );
  } else if (node.server_mode == "cloud") {
    return (
      <ActionIcon variant="filled" radius={"lg"} color={color}>
        <IconCloud stroke={1.75} />
      </ActionIcon>
    );
  } else if (node.server_mode == "local") {
    return (
      <ActionIcon variant="filled" radius={"lg"} color={"#0969ff"}>
        <IconUser stroke={1.75} />
      </ActionIcon>
    );
  }
}
