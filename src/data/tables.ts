interface Table {
  name: string;
  label: string;
}

export const tables: Table[] = [
  {
    name: "wind_lossless",
    label: "wind_lossless",
  },
  {
    name: "wind_5",
    label: "wind_5 (5%)",
  },
  {
    name: "wind_15",
    label: "wind_15 (15%)",
  },
];
