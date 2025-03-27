import { LineChart } from "@mantine/charts";
import "@mantine/charts/styles.css";

export function QueryResultGraph({ queryData }: { queryData: any[] }) {
  const formatDate = (timestamp: string) => {
    const date = new Date(timestamp);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");
    const seconds = String(date.getSeconds()).padStart(2, "0");
    const milliseconds = String(date.getMilliseconds()).padStart(3, "0");
    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}.${milliseconds}`;
  };

  const data = queryData.map((row) => {
    const { datetime, ...rest } = row;
    const filteredRest = Object.fromEntries(
      Object.entries(rest).filter(([_, value]) => typeof value === "number"),
    );

    return {
      date: formatDate(datetime),
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
