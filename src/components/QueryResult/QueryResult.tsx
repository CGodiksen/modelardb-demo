import { ScrollArea, Table } from "@mantine/core";
import cx from "clsx";
import { useState } from "react";

import classes from "./QueryResult.module.css";
import { QueryData } from "../../interfaces/query.ts";

export function QueryResult({ queryData }: { queryData: QueryData }) {
  const [scrolled, setScrolled] = useState(false);

  if (queryData.data.length === 0) {
    return <div>No rows returned.</div>;
  } else {
    const rows = queryData.data.map((row, index) => (
      <Table.Tr key={index}>
        {Object.values(row).map((value) => (
          <Table.Td>{value}</Table.Td>
        ))}
      </Table.Tr>
    ));

    return (
      <ScrollArea
        h={300}
        onScrollPositionChange={({ y }) => setScrolled(y !== 0)}
      >
        <Table miw={700}>
          <Table.Thead
            className={cx(classes.header, { [classes.scrolled]: scrolled })}
          >
            <Table.Tr>
              {queryData.column_names.map((column) => (
                <Table.Th>{column}</Table.Th>
              ))}
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>{rows}</Table.Tbody>
        </Table>
      </ScrollArea>
    );
  }
}
