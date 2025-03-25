import { Container, Title } from "@mantine/core";

export function DataTransferStatistics({ deployment }: { deployment: string }) {
  return (
    <Container fluid>
      <Title order={2}>Data transfer statistics for {deployment}</Title>
    </Container>
  );
}
