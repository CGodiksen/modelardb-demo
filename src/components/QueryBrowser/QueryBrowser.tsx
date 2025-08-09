import { Card, NavLink, ScrollArea } from "@mantine/core";
import { IconFileTypeSql } from "@tabler/icons-react";
import { useState } from "react";

type QueryBrowserProps = {
  queries: string[];
  setEditorText: (text: string) => void;
};

export function QueryBrowser({ queries, setEditorText }: QueryBrowserProps) {
  const [active, setActive] = useState(0);

  const items = queries.map((item, index) => {
    const truncatedQuery = item.length > 52 ? item.slice(0, 49) + "..." : item;

    return (
      <NavLink
        href="#required-for-focus"
        key={item}
        active={index === active}
        label={truncatedQuery}
        leftSection={<IconFileTypeSql size={23} stroke={1.5} />}
        onClick={() => {
          setActive(index);
          setEditorText(item);
        }}
        pt={15}
        pb={15}
      />
    );
  });

  return (
    <Card shadow="sm" padding={2} radius="md" withBorder h={"100%"}>
      <ScrollArea h={"100%"}>{items}</ScrollArea>
    </Card>
  );
}
