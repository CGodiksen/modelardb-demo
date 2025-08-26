import { Container, Grid } from "@mantine/core";

import { QueryBrowser } from "../QueryBrowser/QueryBrowser.tsx";
import { QueryEditor } from "../QueryEditor/QueryEditor.tsx";
import { QueryResult } from "../QueryResult/QueryResult.tsx";
import { ModelardbNode } from "../../interfaces/node.ts";
import { useState } from "react";

type NodeModalProps = {
  node: ModelardbNode;
};

const queries = [
  "SELECT timestamp, wind_speed, rotor_speed FROM wind LIMIT 50",
  "SELECT MIN(wind_speed), MAX(wind_speed) FROM wind",
  "SELECT AVG(wind_speed), SUM(rotor_speed) FROM wind",
  "SELECT COUNT(*) FROM wind WHERE wind_speed > 5",
  "SELECT * FROM wind WHERE rotor_speed > 10 ORDER BY timestamp DESC LIMIT 50",
  "SELECT timestamp, cos_nacelle_dir, sin_nacelle_dir FROM wind LIMIT 50",
  "SELECT rotor_speed, COUNT(*) FROM wind GROUP BY rotor_speed HAVING COUNT(*) > 5 LIMIT 50",
  "SELECT rotor_speed, AVG(wind_speed) FROM wind GROUP BY rotor_speed ORDER BY AVG(wind_speed) DESC LIMIT 10",
];

export function NodeModal({ node }: NodeModalProps) {
  const [editorText, setEditorText] = useState(queries[0]);
  const [queryData, setQueryData] = useState<any[]>([]);

  return (
    <Container fluid p={0} mt={0}>
      <Grid grow>
        <Grid.Col span={4} h={"35vh"}>
          <QueryBrowser
            queries={queries}
            setEditorText={setEditorText}
          ></QueryBrowser>
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
