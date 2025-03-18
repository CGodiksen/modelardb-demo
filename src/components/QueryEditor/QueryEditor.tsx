import { Container } from "@mantine/core";
import CodeMirror from "@uiw/react-codemirror";
import { useState } from "react";
import { sql } from "@codemirror/lang-sql";
import { darcula } from "@uiw/codemirror-theme-darcula";

export function QueryEditor({}) {
  const [editorText, setEditorText] = useState("");

  return (
    <Container fluid>
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
