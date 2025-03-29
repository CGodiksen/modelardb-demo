import { useState } from "react";
import { useDisclosure } from "@mantine/hooks";
import { AdvancedMarker } from "@vis.gl/react-google-maps";
import { Modal, Title } from "@mantine/core";

import { ModelardbNode } from "../../interfaces/node.ts";
import { NodePin } from "../NodePin/NodePin.tsx";
import { NodeModal } from "../NodeModal/NodeModal.tsx";
import { ClientModal } from "../ClientModal/ClientModal.tsx";

type NodeMarkerProps = {
  node: ModelardbNode;
  flushingNode: string;
};

export function NodeMarker({ node, flushingNode }: NodeMarkerProps) {
  const [opened, { open, close }] = useDisclosure(false);
  const [editorText, setEditorText] = useState("");
  const [queryData, setQueryData] = useState<any[]>([]);

  return (
    <>
      {node.type == "modelardb" && (
        <Modal
          opened={opened}
          onClose={close}
          title={<Title order={3}>{node.url ? node.url : "Local"}</Title>}
          size={"80%"}
          centered={true}
        >
          {node.url && (
            <NodeModal
              node={node}
              editorText={editorText}
              setEditorText={setEditorText}
              queryData={queryData}
              setQueryData={setQueryData}
            ></NodeModal>
          )}
          {node.server_mode == "local" && <ClientModal></ClientModal>}
        </Modal>
      )}

      <AdvancedMarker
        position={{ lat: node.latitude, lng: node.longitude }}
        onClick={open}
      >
        <NodePin node={node} flushingNode={flushingNode}></NodePin>
      </AdvancedMarker>
    </>
  );
}
