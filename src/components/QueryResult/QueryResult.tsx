import { Card, Tabs, Text } from "@mantine/core";
import { IconFileAnalytics, IconGraph, IconTable } from "@tabler/icons-react";

import { QueryResultTable } from "../QueryResultTable/QueryResultTable.tsx";
import { QueryResultGraph } from "../QueryResultGraph/QueryResultGraph.tsx";

export function QueryResult({ queryData }: { queryData: any[] }) {
  if (queryData.length === 0) {
    return (
      <Card shadow="sm" padding={2} radius="md" withBorder h={"100%"}>
        <Text ps={10} pt={5}>
          Execute a query to see the results.
        </Text>
      </Card>
    );
  } else {
    return (
      <Card shadow="sm" padding={2} radius="md" withBorder h={"100%"}>
        <Tabs defaultValue="table">
          <Tabs.List>
            <Tabs.Tab value="table" leftSection={<IconTable size={17} />}>
              Table
            </Tabs.Tab>
            <Tabs.Tab value="graph" leftSection={<IconGraph size={20} />}>
              Graph
            </Tabs.Tab>
          </Tabs.List>

          <Tabs.Panel value="table">
            <QueryResultTable queryData={queryData}></QueryResultTable>
          </Tabs.Panel>
          <Tabs.Panel value="graph">
            <QueryResultGraph queryData={queryData}></QueryResultGraph>
          </Tabs.Panel>
        </Tabs>
      </Card>
    );
  }
}
