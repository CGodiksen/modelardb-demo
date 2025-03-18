import { useEffect, useState } from "react";
import { Accordion, Card, List, ScrollArea } from "@mantine/core";
import { IconLayoutColumns, IconTable } from "@tabler/icons-react";
import { invoke } from "@tauri-apps/api/core";

import { ModelardbNode } from "../../interfaces/node.ts";
import { TableSchema } from "../../interfaces/table.ts";

export function SchemaBrowser({ node }: { node: ModelardbNode }) {
  const [tables, setTables] = useState<TableSchema[]>([]);

  useEffect(() => {
    invoke("client_tables", { url: node.url }).then((message) => {
      // @ts-ignore
      setTables(message);
    });
  }, []);

  const items = tables.map((table) => (
    <Accordion.Item key={table.name} value={table.name}>
      <Accordion.Control icon={<IconTable />}>{table.name}</Accordion.Control>
      <Accordion.Panel ps={35}>
        <List spacing="xs" size="sm" center icon={<IconLayoutColumns />}>
          {table.columns.map((column) => (
            <List.Item key={column.name}>
              {column.name}: {column.data_type}
            </List.Item>
          ))}
        </List>
      </Accordion.Panel>
    </Accordion.Item>
  ));

  return (
    <Card shadow="sm" padding={2} radius="md" withBorder h={"100%"}>
      <ScrollArea h={"100%"}>
        <Accordion variant="separated">{items}</Accordion>
      </ScrollArea>
    </Card>
  );
}
