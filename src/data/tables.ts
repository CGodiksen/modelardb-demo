interface Table {
  name: string;
  error_bound: string;
}

export const tables: Table[] = [
  {
    name: "wind",
    error_bound: "lossless",
  },
  {
    name: "wind_5",
    error_bound: "5%",
  },
  {
    name: "wind_15",
    error_bound: "15%",
  },
];
