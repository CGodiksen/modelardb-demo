import { invoke } from "@tauri-apps/api/core";
import { useDisclosure } from "@mantine/hooks";
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
import { resolveResource } from "@tauri-apps/api/path";
import { readTextFile } from "@tauri-apps/plugin-fs";
import "@mantine/core/styles.css";
import "./App.css";

export default function App() {
  const [resetKey, setResetKey] = useState(0);
  const [
    configurationModalOpened,
    { open: openConfigurationModal, close: closeConfigurationModal },
  ] = useDisclosure(false);

  const [nodes, setNodes] = useState<ModelardbNode[]>([]);

  const [ingestedBytes, setIngestedBytes] = useState(0);
  const [modelarDbBytes, setModelarDbBytes] = useState(0);
  const [comparisonSystemBytes, setComparisonSystemBytes] = useState(0);

  const [errorBound, setErrorBound] = useState(5);
  const [samplingRate, setSamplingRate] = useState(4000);
  const [comparisonSystem, setComparisonSystem] = useState<ComparisonSystem>({
    value: "parquet",
    label: "Apache Parquet",
  });

  useEffect(() => {
    setTimeout(() => {
      invoke("create_table", { errorBound: errorBound }).then(() => {
        console.log("Table created successfully.");

        invoke("ingest_into_table", {
          count: samplingRate,
          comparison: comparisonSystem.value,
        }).then(() => {
          console.log(`Started ingesting data into the table.`);

          invoke("flush_nodes").then(() => {
            console.log("Started flushing data from nodes.");

            invoke("monitor_nodes", {
              intervalSeconds: 1,
            }).then(() => {
              console.log("Started monitoring nodes.");
            });
          });
        });
      });
    }, 2000);
  }, [resetKey]);

  useEffect(() => {
    resolveResource("resources/nodes.json").then((resourcePath) => {
      readTextFile(resourcePath).then((jsonData) => {
        setNodes(JSON.parse(jsonData));
      });
    });
  }, []);

  function handleReset() {
    invoke("reset_state").then(() => {
      console.log("State reset successfully.");
    });

    setIngestedBytes(0);
    setModelarDbBytes(0);
    setComparisonSystemBytes(0);

    setResetKey((prev) => prev + 1);
  }

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
              handleReset={handleReset}
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
                  comparisonSystemBytes={comparisonSystemBytes}
                  setComparisonSystemBytes={setComparisonSystemBytes}
                  comparisonSystem={comparisonSystem}
                  resetKey={resetKey}
                ></DataTransferChart>
              </Grid.Col>
              <Grid.Col span={3} pe={0} pt={15} ps={0}>
                <Grid grow>
                  <Grid.Col span={12}>
                    <CompressionRatio
                      ratio={
                        modelarDbBytes !== 0
                          ? ingestedBytes / modelarDbBytes
                          : 0
                      }
                      type="ModelarDB"
                    ></CompressionRatio>
                  </Grid.Col>
                  <Grid.Col span={12}>
                    <CompressionRatio
                      ratio={
                        comparisonSystemBytes !== 0
                          ? ingestedBytes / comparisonSystemBytes
                          : 0
                      }
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
                      resetKey={resetKey}
                    ></NodeGroup>
                  </Grid.Col>
                  <Grid.Col span={12} h={"35vh"} pt={15}>
                    <NodeGroup
                      type={comparisonSystem.label}
                      nodes={nodes.filter(
                        (node) =>
                          node.type === "comparison" &&
                          node.server_mode === "edge"
                      )}
                      openConfigurationModal={openConfigurationModal}
                      resetKey={resetKey}
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
