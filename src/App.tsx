import "@mantine/core/styles.css";
import "./App.css";

import {createTheme, MantineProvider} from '@mantine/core';

const theme = createTheme({
    /** Put your mantine theme override here */
});

export default function App() {
    return (
        <MantineProvider defaultColorScheme="dark" theme={theme}>
        </MantineProvider>
    );
}
