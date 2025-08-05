import { ActionIcon, RingProgress } from "@mantine/core";
import { IconCloud, IconUser, IconWindmill } from "@tabler/icons-react";

import { ModelardbNode } from "../../interfaces/node.ts";
import { useEffect, useState } from "react";
import { COMPARISON_SYSTEM_COLOR, MODELARDB_COLOR } from "../../constants.ts";

export function NodePin({
  node,
  flushingNode,
}: {
  node: ModelardbNode;
  flushingNode: string;
}) {
  const color =
    node.type == "modelardb" ? MODELARDB_COLOR : COMPARISON_SYSTEM_COLOR;
  const [loadingValue, setLoadingValue] = useState(0);

  useEffect(() => {
    let animationFrame: number;
    setLoadingValue(0);

    const updateLoadingValue = () => {
      setLoadingValue((prev) => {
        if (prev >= 150) {
          return 150;
        }
        animationFrame = requestAnimationFrame(updateLoadingValue);
        return prev + 1;
      });
    };

    if (node.url == flushingNode) {
      animationFrame = requestAnimationFrame(updateLoadingValue);
    }

    return () => cancelAnimationFrame(animationFrame);
  }, [flushingNode]);

  if (node.server_mode == "edge") {
    if (node.url == flushingNode && loadingValue != 150) {
      return (
        <RingProgress
          sections={[{ value: loadingValue, color: color }]}
          size={42}
          pt={6}
        />
      );
    } else {
      return (
        <ActionIcon variant="filled" radius={"lg"} color={color}>
          <IconWindmill stroke={1.75} />
        </ActionIcon>
      );
    }
  } else if (node.server_mode == "cloud") {
    return (
      <ActionIcon variant="filled" radius={"lg"} color={color}>
        <IconCloud stroke={1.75} />
      </ActionIcon>
    );
  } else if (node.server_mode == "local") {
    return (
      <ActionIcon variant="filled" radius={"lg"} color={MODELARDB_COLOR}>
        <IconUser stroke={1.75} />
      </ActionIcon>
    );
  }
}
