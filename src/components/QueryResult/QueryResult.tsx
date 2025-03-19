import { ScrollArea, Table } from "@mantine/core";
import cx from "clsx";
import { useState } from "react";

import classes from "./QueryResult.module.css";

export function QueryResult({ queryData }: { queryData: any[] }) {
  const [scrolled, setScrolled] = useState(false);

  if (queryData.length === 0) {
    return <div>No rows returned.</div>;
  } else {
    const rows = queryData.map((row, index) => (
      <Table.Tr key={index}>
        {Object.values(row).map((value) => (
          // @ts-ignore
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
              {Object.keys(queryData[0]).map((column) => (
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
