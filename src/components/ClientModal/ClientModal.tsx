import {
  Card,
  Container,
  Grid,
  Code,
  ScrollArea,
  NavLink,
} from "@mantine/core";
import CodeMirror from "@uiw/react-codemirror";
import { python } from "@codemirror/lang-python";
import { darcula } from "@uiw/codemirror-theme-darcula";
import { useEffect, useState } from "react";
import { IconBrandPython } from "@tabler/icons-react";

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
    filename: "copy_cloud_to_local.py",
    name: "Copy From Cloud to Local",
    description: "This script copies data from a cloud node to a local folder.",
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

  useEffect(() => {
    fetch(
      `/ModelarDB-RS-Demo/crates/modelardb_embedded/bindings/python/${pythonScripts[active].filename}`
    )
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
          <Card shadow="sm" padding={2} radius="md" withBorder h={"100%"}>
            <CodeMirror
              value={editorText}
              height="340px"
              extensions={[python()]}
              onChange={setEditorText}
              theme={darcula}
              placeholder={"Enter your Python here..."}
              readOnly={true}
            />
          </Card>
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
