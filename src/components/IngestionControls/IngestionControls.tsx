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

export function IngestionControls() {
  const [wind1IngestionCount, setWind1IngestionCount] = useState<
    string | number
  >(100);
  const [wind2IngestionCount, setWind2IngestionCount] = useState<
    string | number
  >(200);
  const [wind3IngestionCount, setWind3IngestionCount] = useState<
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
          tableName: "wind_1",
          count: wind1IngestionCount,
        }).then(() => {
          console.log("Started ingesting data into wind_1.");
        });

        invoke("ingest_into_table", {
          tableName: "wind_2",
          count: wind2IngestionCount,
        }).then(() => {
          console.log("Started ingesting data into wind_2.");
        });

        invoke("ingest_into_table", {
          tableName: "wind_3",
          count: wind3IngestionCount,
        }).then(() => {
          console.log("Started ingesting data into wind_3.");
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
                  ingestion rate
                </Text>
                <Text fw={700} fz="xl">
                  {numberWithCommas(
                    (8 + 12 * 4) *
                      ((wind1IngestionCount as number) +
                        (wind2IngestionCount as number) +
                        (wind3IngestionCount as number)),
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
              label="wind_1 (lossless)"
              description="Ingested data points per second"
              min={0}
              max={10000}
              allowDecimal={false}
              step={100}
              value={wind1IngestionCount}
              onChange={setWind1IngestionCount}
            />
          </Paper>
        </Grid.Col>
        <Grid.Col span={6}>
          <Paper withBorder radius="md" p={10}>
            <NumberInput
              label="wind_2 (5%)"
              description="Ingested data points per second"
              min={0}
              max={10000}
              allowDecimal={false}
              step={100}
              value={wind2IngestionCount}
              onChange={setWind2IngestionCount}
            />
          </Paper>
        </Grid.Col>
        <Grid.Col span={6}>
          <Paper withBorder radius="md" p={10}>
            <NumberInput
              label="wind_3 (15%)"
              description="Ingested data points per second"
              min={0}
              max={10000}
              allowDecimal={false}
              step={100}
              value={wind3IngestionCount}
              onChange={setWind3IngestionCount}
            />
          </Paper>
        </Grid.Col>
      </Grid>
    </Container>
  );
}
