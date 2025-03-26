import {
  Container,
  Grid,
  Group,
  NumberInput,
  Paper,
  Text,
} from "@mantine/core";
import { useState } from "react";
import { useHotkeys } from "@mantine/hooks";
import { invoke } from "@tauri-apps/api/core";

import { tables } from "../../data/tables.ts";

export function IngestionControls() {
  const [table1IngestionCount, setTable1IngestionCount] = useState<
    string | number
  >(100);
  const [table2IngestionCount, setTable2IngestionCount] = useState<
    string | number
  >(200);
  const [table3IngestionCount, setTable3IngestionCount] = useState<
    string | number
  >(300);

  function numberWithCommas(x: number): string {
    return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  }

  useHotkeys([
    [
      "ctrl+r",
      () => {
        invoke("ingest_into_table", {
          tableName: tables[0].name,
          count: table1IngestionCount,
        }).then(() => {
          console.log(`Started ingesting data into ${tables[0]}.`);
        });

        invoke("ingest_into_table", {
          tableName: tables[1].name,
          count: table2IngestionCount,
        }).then(() => {
          console.log(`Started ingesting data into ${tables[1]}.`);
        });

        invoke("ingest_into_table", {
          tableName: tables[2].name,
          count: table3IngestionCount,
        }).then(() => {
          console.log(`Started ingesting data into ${tables[2]}.`);
        });
      },
    ],
  ]);

  return (
    <Container fluid>
      <Grid grow>
        <Grid.Col span={6}>
          <Paper withBorder radius="md" p={10}>
            <Group justify="apart">
              <div>
                <Text c="dimmed" tt="uppercase" fw={700} fz="xs">
                  Total ingestion rate
                </Text>
                <Text fw={700} fz="xl">
                  {numberWithCommas(
                    (8 + 12 * 4) *
                      ((table1IngestionCount as number) +
                        (table2IngestionCount as number) +
                        (table3IngestionCount as number)),
                  )}{" "}
                  Bytes
                </Text>
              </div>
            </Group>
            <Text c="dimmed" fz="sm" mt={10}>
              Data ingested per second
            </Text>
          </Paper>
        </Grid.Col>
        <Grid.Col span={6}>
          <Paper withBorder radius="md" p={10}>
            <NumberInput
              label={tables[0].label}
              description="Ingested data points per second"
              min={0}
              max={10000}
              allowDecimal={false}
              step={100}
              value={table1IngestionCount}
              onChange={setTable1IngestionCount}
            />
          </Paper>
        </Grid.Col>
        <Grid.Col span={6}>
          <Paper withBorder radius="md" p={10}>
            <NumberInput
              label={tables[1].label}
              description="Ingested data points per second"
              min={0}
              max={10000}
              allowDecimal={false}
              step={100}
              value={table2IngestionCount}
              onChange={setTable2IngestionCount}
            />
          </Paper>
        </Grid.Col>
        <Grid.Col span={6}>
          <Paper withBorder radius="md" p={10}>
            <NumberInput
              label={tables[2].label}
              description="Ingested data points per second"
              min={0}
              max={10000}
              allowDecimal={false}
              step={100}
              value={table3IngestionCount}
              onChange={setTable3IngestionCount}
            />
          </Paper>
        </Grid.Col>
      </Grid>
    </Container>
  );
}
