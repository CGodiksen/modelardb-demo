import { ActionIcon, RingProgress } from "@mantine/core";
import { IconCloud, IconUser, IconWindmill } from "@tabler/icons-react";

import { ModelardbNode } from "../../interfaces/node.ts";
import { useEffect, useState } from "react";

export function NodePin({
  node,
  flushingNode,
}: {
  node: ModelardbNode;
  flushingNode: string;
}) {
  const color = node.type == "modelardb" ? "#0969ff" : "#7d3fc9";
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
      <ActionIcon variant="filled" radius={"lg"} color={"#0969ff"}>
        <IconUser stroke={1.75} />
      </ActionIcon>
    );
  }
}
