import { Container, Grid } from "@mantine/core";
import { ConfigurationSetting } from "../ConfigurationSetting/ConfigurationSetting";

export function Configuration() {
  return (
    <Container fluid ps={5} pe={5} mt={20}>
      <Grid grow>
        <Grid.Col span={6}>
          <ConfigurationSetting
            title="Compression"
            value="5% Error Bound"
            type="ModelarDB nodes"
          />
        </Grid.Col>
        <Grid.Col span={6}>
          <ConfigurationSetting
            title="Compression"
            value="Lossless"
            type="Parquet nodes"
          />
        </Grid.Col>
        <Grid.Col span={6}>
          <ConfigurationSetting
            title="Sampling Rate"
            value="1000 Hz"
            type="All nodes"
          />
        </Grid.Col>
        <Grid.Col span={6}>
          <ConfigurationSetting
            title="Bandwidth"
            value="500 Mbps"
            type="All nodes"
          />
        </Grid.Col>
      </Grid>
    </Container>
  );
}
