import { theme } from "./theme";
import "@mantine/core/styles.css";
import "./App.css";

import { MantineProvider } from "@mantine/core";

export default function App() {
  return (
    <MantineProvider defaultColorScheme="dark" theme={theme}></MantineProvider>
  );
}
