import { Container } from "@mantine/core";
import CodeMirror from "@uiw/react-codemirror";
import { useState } from "react";
import { sql } from "@codemirror/lang-sql";
import { darcula } from "@uiw/codemirror-theme-darcula";
import { useHotkeys } from "@mantine/hooks";
import { invoke } from "@tauri-apps/api/core";

import { ModelardbNode } from "../../interfaces/node.ts";

type QueryEditorProps = {
  node: ModelardbNode;
  setQueryData: (data: any[]) => void;
};

export function QueryEditor({ node, setQueryData }: QueryEditorProps) {
  const [editorText, setEditorText] = useState("");

  useHotkeys([
    [
      "ctrl+enter",
      () => {
        invoke("client_query", { url: node.url, query: editorText }).then(
          // @ts-ignore
          (message: any[]) => {
            let json_string = new TextDecoder().decode(new Uint8Array(message));
            let json_data = JSON.parse(json_string);

            setQueryData(json_data);
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
