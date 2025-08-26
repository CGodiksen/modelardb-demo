import { ActionIcon, Paper } from "@mantine/core";
import CodeMirror from "@uiw/react-codemirror";
import { sql } from "@codemirror/lang-sql";
import { darcula } from "@uiw/codemirror-theme-darcula";
import { invoke } from "@tauri-apps/api/core";

import { ModelardbNode } from "../../interfaces/node.ts";
import { IconPlayerPlayFilled } from "@tabler/icons-react";

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
      }
    );
  }

  return (
    <Paper withBorder pt={5}>
      <ActionIcon
        variant="filled"
        color="green"
        mb={5}
        ms={5}
        onClick={handleRunQuery}
      >
        <IconPlayerPlayFilled
          style={{ width: "70%", height: "70%" }}
          stroke={1.5}
        />
      </ActionIcon>

      <CodeMirror
        value={editorText}
        height="300px"
        width="890px"
        extensions={[sql()]}
        onChange={setEditorText}
        theme={darcula}
        placeholder={"Enter your SQL query here..."}
      />
    </Paper>
  );
}
