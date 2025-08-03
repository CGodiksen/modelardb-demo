import { Container, Grid } from "@mantine/core";

import { SchemaBrowser } from "../SchemaBrowser/SchemaBrowser.tsx";
import { QueryEditor } from "../QueryEditor/QueryEditor.tsx";
import { QueryResult } from "../QueryResult/QueryResult.tsx";
import { ModelardbNode } from "../../interfaces/node.ts";
import { useState } from "react";

type NodeModalProps = {
  node: ModelardbNode;
};

export function NodeModal({ node }: NodeModalProps) {
  const [editorText, setEditorText] = useState("");
  const [queryData, setQueryData] = useState<any[]>([]);

  return (
    <Container fluid p={0} mt={0}>
      <Grid grow>
        <Grid.Col span={4} h={"35vh"}>
          <SchemaBrowser node={node}></SchemaBrowser>
        </Grid.Col>
        <Grid.Col span={8}>
          <QueryEditor
            node={node}
            editorText={editorText}
            setEditorText={setEditorText}
            setQueryData={setQueryData}
          ></QueryEditor>
        </Grid.Col>
        <Grid.Col span={12} h={"35vh"}>
          <QueryResult queryData={queryData}></QueryResult>
        </Grid.Col>
      </Grid>
    </Container>
  );
}
