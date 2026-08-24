import { Button, Group, Paper } from "@mantine/core";
import CodeMirror from "@uiw/react-codemirror";
import { sql } from "@codemirror/lang-sql";
import { darcula } from "@uiw/codemirror-theme-darcula";
import { invoke } from "@tauri-apps/api/core";

import { ModelardbNode } from "../../interfaces/node.ts";
import { IconPlayerPlayFilled } from "@tabler/icons-react";
import classes from "./QueryEditor.module.css";

type QueryEditorProps = {
  node: ModelardbNode;
  editorText: string;
  setEditorText: (text: string) => void;
  setQueryData: (data: any[]) => void;
  setResultText: (text: string) => void;
};

export function QueryEditor({
  node,
  editorText,
  setEditorText,
  setQueryData,
  setResultText,
}: QueryEditorProps) {
  function handleRunQuery() {
    setQueryData([]);
    setResultText("Executing query...");

    invoke("client_query", { url: node.url, query: editorText }).then(
      // @ts-ignore
      (message: any[]) => {
        let json_string = new TextDecoder().decode(new Uint8Array(message));
        let json_data = JSON.parse(json_string);

        if (json_data.length === 0) {
          setResultText("Query executed successfully. No results.");
        } else {
          setQueryData(json_data);
        }
      },
    );
  }

  return (
    <Paper withBorder className={classes.editor}>
      <Group className={classes.toolbar} px={8} py={6}>
        <Button
          size="compact-xs"
          color="green"
          leftSection={<IconPlayerPlayFilled size={11} />}
          classNames={{
            section: classes.run_section,
            label: classes.run_label,
          }}
          onClick={handleRunQuery}
        >
          Run
        </Button>
      </Group>

      <CodeMirror
        value={editorText}
        height="300px"
        width="100%"
        extensions={[sql()]}
        onChange={setEditorText}
        theme={darcula}
        placeholder={"Enter your SQL query here..."}
      />
    </Paper>
  );
}
