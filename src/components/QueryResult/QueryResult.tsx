import { Card, Text } from "@mantine/core";
import { QueryResultTable } from "../QueryResultTable/QueryResultTable.tsx";

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
        <QueryResultTable queryData={queryData}></QueryResultTable>
      </Card>
    );
  }
}
