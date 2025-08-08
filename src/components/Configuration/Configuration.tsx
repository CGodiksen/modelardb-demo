import { Container, Grid } from "@mantine/core";
import { ConfigurationSetting } from "../ConfigurationSetting/ConfigurationSetting";

export function Configuration() {
  return (
    <Container fluid ps={5} pe={5} mt={15}>
      <Grid grow>
        <Grid.Col span={6}>
          <ConfigurationSetting
            title="Compression"
            value="5% Error Bound"
            type="ModelarDB"
          />
        </Grid.Col>
        <Grid.Col span={6}>
          <ConfigurationSetting
            title="Compression"
            value="Lossless"
            type="Apache Parquet"
          />
        </Grid.Col>
        <Grid.Col span={6}>
          <ConfigurationSetting
            title="Sampling Rate"
            value="1000 Hz"
            type="All"
          />
        </Grid.Col>
        <Grid.Col span={6}>
          <ConfigurationSetting title="Bandwidth" value="500 Mbps" type="All" />
        </Grid.Col>
      </Grid>
    </Container>
  );
}
