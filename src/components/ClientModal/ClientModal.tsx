import { Card, Container, Grid, Code } from "@mantine/core";
import CodeMirror from "@uiw/react-codemirror";
import { python } from "@codemirror/lang-python";
import { darcula } from "@uiw/codemirror-theme-darcula";
import { useState } from "react";

export function ClientModal() {
  const [editorText, setEditorText] = useState(
    "import modelardb\n" +
      "\n" +
      "# Connect to an edge node and a local folder.\n" +
      'modelardbd = modelardb.connect(modelardb.Server("grpc://127.0.0.1:9981"))\n' +
      "local = modelardb.open_local()\n" +
      "\n" +
      "# Copy data from the edge to the local folder.\n" +
      'copy_sql = "SELECT * FROM wind"\n' +
      "modelardbd.copy(copy_sql, local, 'wind')\n" +
      "\n" +
      "# Execute a query in the local folder and print the result.\n" +
      'read_sql = "SELECT timestamp, active_power FROM wind LIMIT 5"\n' +
      "print(local.read(read_sql))",
  );

  const [consoleOutput, setConsoleOutput] = useState(
    "{'active_power': [377.95465087890625,\n" +
      "                  380.32586669921875,\n" +
      "                  382.20159912109375,\n" +
      "                  384.2398681640625,\n" +
      "                  384.2398681640625],\n" +
      " 'timestamp': [datetime.datetime(2025, 3, 29, 13, 57, 29, 944464),\n" +
      "               datetime.datetime(2025, 3, 29, 13, 57, 29, 954464),\n" +
      "               datetime.datetime(2025, 3, 29, 13, 57, 29, 964464),\n" +
      "               datetime.datetime(2025, 3, 29, 13, 57, 29, 974464),\n" +
      "               datetime.datetime(2025, 3, 29, 13, 57, 29, 984464)]}\n" +
      "\n" +
      "Process finished with exit code 0",
  );

  return (
    <Container fluid p={0} mt={0}>
      <Grid grow>
        <Grid.Col span={12} h={"35vh"}>
          <Card shadow="sm" padding={2} radius="md" withBorder h={"100%"}>
            <CodeMirror
              value={editorText}
              height="340px"
              extensions={[python()]}
              onChange={setEditorText}
              theme={darcula}
              placeholder={"Enter your Python here..."}
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
