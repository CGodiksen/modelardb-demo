import { invoke } from "@tauri-apps/api/core";
import { useDisclosure, useHotkeys } from "@mantine/hooks";
import {
  AppShell,
  Container,
  Grid,
  MantineProvider,
  Modal,
  Title,
} from "@mantine/core";
import { NodeMap } from "./components/NodeMap/NodeMap.tsx";
import { theme } from "./theme";
import { NodeGroup } from "./components/NodeGroup/NodeGroup.tsx";
import { Configuration } from "./components/Configuration/Configuration.tsx";
import { DataTransferChart } from "./components/DataTransferChart/DataTransferChart.tsx";
import { useEffect, useState } from "react";
import { ModelardbNode } from "./interfaces/node.ts";
import { CompressionRatio } from "./components/CompressionRatio/CompressionRatio.tsx";
import { ConfigurationModal } from "./components/ConfigurationModal/ConfigurationModal.tsx";
import { ComparisonSystem } from "./interfaces/system.ts";
import "@mantine/core/styles.css";
import "./App.css";

export default function App() {
  const [
    configurationModalOpened,
    { open: openConfigurationModal, close: closeConfigurationModal },
  ] = useDisclosure(false);

  const [nodes, setNodes] = useState<ModelardbNode[]>([]);

  const [ingestedBytes, setIngestedBytes] = useState(0);
  const [modelarDbBytes, setModelarDbBytes] = useState(0);
  const [parquetBytes, setParquetBytes] = useState(0);

  const [errorBound, setErrorBound] = useState(5);
  const [samplingRate, setSamplingRate] = useState(1000);
  const [comparisonSystem, setComparisonSystem] = useState<ComparisonSystem>({
    value: "tsfile",
    label: "Apache TsFile",
  });

  useHotkeys([
    [
      "ctrl+r",
      () => {
        invoke("ingest_into_table", {
          count: 1000,
        }).then(() => {
          console.log(`Started ingesting data into the table.`);
        });
      },
    ],
  ]);

  useHotkeys([
    [
      "ctrl+t",
      () => {
        invoke("create_tables", {}).then(() => {
          console.log("Tables created successfully.");
        });
      },
    ],
  ]);

  useHotkeys([
    [
      "ctrl+f",
      () => {
        invoke("flush_nodes", {
          intervalSeconds: 20,
        }).then(() => {
          console.log("Started flushing data from nodes.");
        });
      },
    ],
  ]);

  useEffect(() => {
    fetch("/data/nodes.json")
      .then((res) => res.json())
      .then((data) => setNodes(data))
      .catch((error) => console.error("Error fetching nodes:", error));
  }, []);

  return (
    <MantineProvider defaultColorScheme="dark" theme={theme}>
      <AppShell>
        <AppShell.Main p={10} pt={20}>
          <Modal
            opened={configurationModalOpened}
            onClose={closeConfigurationModal}
            title={<Title order={3}>Simulation Configuration</Title>}
            size={"30%"}
            centered={true}
          >
            <ConfigurationModal
              errorBound={errorBound}
              setErrorBound={setErrorBound}
              samplingRate={samplingRate}
              setSamplingRate={setSamplingRate}
              comparisonSystem={comparisonSystem}
              setComparisonSystem={setComparisonSystem}
              close={closeConfigurationModal}
            />
          </Modal>

          <Container fluid>
            <Grid columns={24} grow>
              <Grid.Col span={7}>
                <Configuration
                  errorBound={errorBound}
                  samplingRate={samplingRate}
                  comparisonSystem={comparisonSystem}
                ></Configuration>
              </Grid.Col>
              <Grid.Col span={14} pe={0}>
                <DataTransferChart
                  ingestedBytes={ingestedBytes}
                  setIngestedBytes={setIngestedBytes}
                  modelarDbBytes={modelarDbBytes}
                  setModelarDbBytes={setModelarDbBytes}
                  parquetBytes={parquetBytes}
                  setParquetBytes={setParquetBytes}
                  comparisonSystem={comparisonSystem}
                ></DataTransferChart>
              </Grid.Col>
              <Grid.Col span={3} pe={0} pt={15} ps={0}>
                <Grid grow>
                  <Grid.Col span={12}>
                    <CompressionRatio
                      ratio={ingestedBytes / modelarDbBytes}
                      type="ModelarDB"
                    ></CompressionRatio>
                  </Grid.Col>
                  <Grid.Col span={12}>
                    <CompressionRatio
                      ratio={ingestedBytes / parquetBytes}
                      type={comparisonSystem.label}
                    ></CompressionRatio>
                  </Grid.Col>
                </Grid>
              </Grid.Col>
              <Grid.Col span={7}>
                <Grid grow>
                  <Grid.Col span={12} h={"35vh"}>
                    <NodeGroup
                      type="ModelarDB"
                      nodes={nodes.filter(
                        (node) =>
                          node.type === "modelardb" &&
                          node.server_mode === "edge"
                      )}
                      openConfigurationModal={openConfigurationModal}
                    ></NodeGroup>
                  </Grid.Col>
                  <Grid.Col span={12} h={"35vh"} pt={15}>
                    <NodeGroup
                      type={comparisonSystem.label}
                      nodes={nodes.filter(
                        (node) =>
                          node.type === "parquet" && node.server_mode === "edge"
                      )}
                      openConfigurationModal={openConfigurationModal}
                    ></NodeGroup>
                  </Grid.Col>
                </Grid>
              </Grid.Col>
              <Grid.Col span={17}>
                <NodeMap nodes={nodes}></NodeMap>
              </Grid.Col>
            </Grid>
          </Container>
        </AppShell.Main>
      </AppShell>
    </MantineProvider>
  );
}
