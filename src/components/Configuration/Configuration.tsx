import { Container, Grid } from "@mantine/core";
import { ConfigurationSetting } from "../ConfigurationSetting/ConfigurationSetting";
import { ComparisonSystem } from "../../interfaces/system";

type ConfigurationProps = {
  errorBound: number;
  samplingRate: number;
  comparisonSystem: ComparisonSystem;
};

export function Configuration({
  errorBound,
  samplingRate,
  comparisonSystem,
}: ConfigurationProps) {
  return (
    <Container fluid ps={5} pe={5} mt={15}>
      <Grid grow>
        <Grid.Col span={6}>
          <ConfigurationSetting
            title="Compression"
            value={`${errorBound}% Error Bound`}
            type="ModelarDB"
          />
        </Grid.Col>
        <Grid.Col span={6}>
          <ConfigurationSetting
            title="Compression"
            value="Lossless"
            type={comparisonSystem.label}
          />
        </Grid.Col>
        <Grid.Col span={6}>
          <ConfigurationSetting
            title="Sampling Rate"
            value={`${samplingRate} Hz`}
            type="All"
          />
        </Grid.Col>
        <Grid.Col span={6}>
          <ConfigurationSetting title="Bandwidth" value="500 Kbps" type="All" />
        </Grid.Col>
      </Grid>
    </Container>
  );
}
