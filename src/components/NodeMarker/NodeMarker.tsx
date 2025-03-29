import { useDisclosure } from "@mantine/hooks";
import { AdvancedMarker } from "@vis.gl/react-google-maps";
import { Modal, Title } from "@mantine/core";

import { ModelardbNode } from "../../interfaces/node.ts";
import { NodePin } from "../NodePin/NodePin.tsx";
import { NodeModal } from "../NodeModal/NodeModal.tsx";

type NodeMarkerProps = {
  node: ModelardbNode;
  flushingNode: string;
};

export function NodeMarker({ node, flushingNode }: NodeMarkerProps) {
  const [opened, { open, close }] = useDisclosure(false);

  return (
    <>
      {node.url && node.type == "modelardb" && (
        <Modal
          opened={opened}
          onClose={close}
          title={<Title order={3}>{node.url}</Title>}
          size={"80%"}
          centered={true}
        >
          <NodeModal node={node}></NodeModal>
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
