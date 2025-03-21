import { useState } from "react";
import { useDisclosure } from "@mantine/hooks";
import { AdvancedMarker } from "@vis.gl/react-google-maps";
import { Container, Grid, Modal, Title } from "@mantine/core";

import { ModelardbNode } from "../../interfaces/node.ts";
import { SchemaBrowser } from "../SchemaBrowser/SchemaBrowser.tsx";
import { QueryEditor } from "../QueryEditor/QueryEditor.tsx";
import { QueryResult } from "../QueryResult/QueryResult.tsx";
import { NodePin } from "../NodePin/NodePin.tsx";

export function NodeMarker({ node }: { node: ModelardbNode }) {
  const [opened, { open, close }] = useDisclosure(false);
  const [editorText, setEditorText] = useState("");
  const [queryData, setQueryData] = useState<any[]>([]);

  return (
    <>
      <Modal
        opened={opened}
        onClose={close}
        title={<Title order={3}>{node.url}</Title>}
        size={"80%"}
        centered={true}
      >
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
      </Modal>

      <AdvancedMarker
        position={{ lat: node.latitude, lng: node.longitude }}
        onClick={open}
      >
        <NodePin node={node}></NodePin>
      </AdvancedMarker>
    </>
  );
}
