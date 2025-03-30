import { LineChart } from "@mantine/charts";
import "@mantine/charts/styles.css";

import { formatDate } from "../../util.ts";

export function QueryResultGraph({ queryData }: { queryData: any[] }) {
  const data = queryData.map((row) => {
    const { timestamp, ...rest } = row;
    const filteredRest = Object.fromEntries(
      Object.entries(rest).filter(([_, value]) => typeof value === "number"),
    );

    return {
      date: formatDate(timestamp, true),
      ...filteredRest,
    };
  });

  const colors = [
    "indigo.6",
    "blue.6",
    "teal.6",
    "red.6",
    "green.6",
    "orange.6",
    "purple.6",
    "yellow.6",
    "pink.6",
    "cyan.6",
  ];

  const series = Object.keys(data[0])
    .filter((key) => key !== "date")
    .map((key, index) => ({
      name: key,
      color: colors[index % colors.length],
    }));

  return (
    <LineChart
      h={280}
      pt={15}
      data={data}
      dataKey="date"
      series={series}
      curveType="linear"
      tickLine="none"
    />
  );
}
