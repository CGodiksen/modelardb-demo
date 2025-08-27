import {
  Card,
  Container,
  Grid,
  Code,
  ScrollArea,
  NavLink,
  ActionIcon,
  Paper,
} from "@mantine/core";
import CodeMirror from "@uiw/react-codemirror";
import { python } from "@codemirror/lang-python";
import { darcula } from "@uiw/codemirror-theme-darcula";
import { useEffect, useState } from "react";
import { IconBrandPython, IconPlayerPlayFilled } from "@tabler/icons-react";
import { invoke } from "@tauri-apps/api/core";

const pythonScripts = [
  {
    filename: "query_edge_and_cloud.py",
    name: "Query Edge and Cloud",
    description:
      "This script demonstrates querying data from both edge and cloud nodes.",
  },
  {
    filename: "list_tables_and_get_schema.py",
    name: "List Tables and Get Schema",
    description:
      "This script lists all tables and retrieves the schema of a table.",
  },
  {
    filename: "create_write_read_drop.py",
    name: "Create, Write, Read, and Drop",
    description:
      "This script demonstrates creating a table, writing data, reading it back, and dropping the table.",
  },
  {
    filename: "read_time_series_table.py",
    name: "Read Time Series Table",
    description:
      "This script reads a time series table using a convenience function.",
  },
];

export function ClientModal() {
  const [active, setActive] = useState(0);

  const [editorText, setEditorText] = useState("");
  const [consoleOutput, setConsoleOutput] = useState(
    "Run the code to see the result."
  );

  const items = pythonScripts.map((item, index) => (
    <NavLink
      href="#required-for-focus"
      key={item.name}
      active={index === active}
      label={item.name}
      description={item.description}
      leftSection={<IconBrandPython size={23} stroke={1.5} />}
      onClick={() => setActive(index)}
      pt={15}
      pb={15}
    />
  ));

  function handleRunScript() {
    setConsoleOutput("Running script...");

    invoke("run_python_script", {
      filename: pythonScripts[active].filename,
    }).then(
      // @ts-ignore
      (message: any[]) => {
        const [stdout, stderr, exitCode] = message;

        const stdoutStr = new TextDecoder().decode(
          new Uint8Array(stdout).buffer
        );
        const stderrStr = new TextDecoder().decode(
          new Uint8Array(stderr).buffer
        );

        let output = exitCode === 0 ? stdoutStr : stderrStr;
        output += `\n\nProcess finished with exit code ${exitCode}`;
        setConsoleOutput(output);
      }
    );
  }

  useEffect(() => {
    fetch(`/python-scripts/scripts/${pythonScripts[active].filename}`)
      .then((res) => res.text())
      .then((text) => setEditorText(text))
      .catch(() => setEditorText("# Failed to load script."));
  }, [active]);

  return (
    <Container fluid p={0} mt={0}>
      <Grid grow>
        <Grid.Col span={4}>
          <Card shadow="sm" padding={2} radius="md" withBorder h={"100%"}>
            <ScrollArea h={"100%"}>{items}</ScrollArea>
          </Card>
        </Grid.Col>
        <Grid.Col span={8} h={"35vh"}>
          <Paper withBorder pt={5} bg={"rgb(43, 43, 43)"}>
            <ActionIcon
              variant="filled"
              color="green"
              mb={5}
              ms={5}
              onClick={handleRunScript}
            >
              <IconPlayerPlayFilled
                style={{ width: "70%", height: "70%" }}
                stroke={1.5}
              />
            </ActionIcon>

            <CodeMirror
              value={editorText}
              height="297px"
              extensions={[python()]}
              onChange={setEditorText}
              theme={darcula}
              placeholder={"Enter your Python here..."}
              readOnly={true}
            />
          </Paper>
        </Grid.Col>
        <Grid.Col span={12} h={"35vh"}>
          <Code p={10} block h={"100%"} color={"#2b2b2b"}>
            {consoleOutput}
          </Code>
        </Grid.Col>
      </Grid>
    </Container>
  );
}
