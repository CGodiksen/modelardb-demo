import { Container, Title } from "@mantine/core";

export function TableStatistics({ deployment }: { deployment: string }) {
  return (
    <Container fluid>
      <Title order={2}>Table statistics for {deployment}</Title>
    </Container>
  );
}
