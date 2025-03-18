import { Container } from "@mantine/core";
import CodeMirror from "@uiw/react-codemirror";
import { useState } from "react";
import { sql } from "@codemirror/lang-sql";
import { darcula } from "@uiw/codemirror-theme-darcula";
import { useHotkeys } from "@mantine/hooks";
import { invoke } from "@tauri-apps/api/core";

import { ModelardbNode } from "../../interfaces/node.ts";
import { QueryData } from "../../interfaces/query.ts";

type QueryEditorProps = {
  node: ModelardbNode;
  setQueryData: (data: QueryData) => void;
};

export function QueryEditor({ node, setQueryData }: QueryEditorProps) {
  const [editorText, setEditorText] = useState("");

  useHotkeys([
    [
      "ctrl+enter",
      () => {
        invoke("client_query", { url: node.url, query: editorText }).then(
          (message) => {
            let json_string = new TextDecoder().decode(
              // @ts-ignore
              new Uint8Array(message.data),
            );

            let json_data = JSON.parse(json_string);
            setQueryData({
              column_names: message.column_names,
              data: json_data,
            });
          },
        );
      },
    ],
  ]);

  return (
    <Container fluid p={0}>
      <CodeMirror
        value={editorText}
        height="390px"
        extensions={[sql()]}
        onChange={setEditorText}
        theme={darcula}
        placeholder={"Enter your SQL query here..."}
      />
    </Container>
  );
}
