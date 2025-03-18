import { useDisclosure } from "@mantine/hooks";
import { AdvancedMarker, Pin } from "@vis.gl/react-google-maps";
import { Container, Grid, Modal, Title } from "@mantine/core";

import { ModelardbNode } from "../../interfaces/node.ts";

export function NodeMarker({ node }: { node: ModelardbNode }) {
  const [opened, { open, close }] = useDisclosure(false);

  return (
    <>
      <Modal
        opened={opened}
        onClose={close}
        title={<Title order={3}>{node.url}</Title>}
        size={"80%"}
        centered={true}
      >
        <Container fluid p={0} mt={10}>
          <Grid grow>
            <Grid.Col span={4} h={"40vh"}>
              <Title order={4}>Schema browser</Title>
            </Grid.Col>
            <Grid.Col span={8}>
              <Title order={4}>Query window</Title>
            </Grid.Col>
            <Grid.Col span={12} h={"30vh"}>
              <Title order={4}>Query result</Title>
            </Grid.Col>
          </Grid>
        </Container>
      </Modal>

      <AdvancedMarker
        position={{ lat: node.latitude, lng: node.longitude }}
        onClick={open}
      >
        <Pin background={"#FBBC04"} glyphColor={"#000"} borderColor={"#000"} />
      </AdvancedMarker>
    </>
  );
}
