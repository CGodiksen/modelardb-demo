import {
  Button,
  Container,
  Group,
  NativeSelect,
  NumberInput,
} from "@mantine/core";
import { useForm } from "@mantine/form";

type ConfigurationModalProps = {
  errorBound: number;
  setErrorBound: (value: number) => void;
  samplingRate: number;
  setSamplingRate: (value: number) => void;
  comparisonSystem: string;
  setComparisonSystem: (value: string) => void;
  close: () => void;
};

export function ConfigurationModal({
  errorBound,
  setErrorBound,
  samplingRate,
  setSamplingRate,
  comparisonSystem,
  setComparisonSystem,
  close,
}: ConfigurationModalProps) {
  const form = useForm({
    mode: "uncontrolled",
    initialValues: {
      errorBound: errorBound,
      samplingRate: samplingRate,
      comparisonSystem: comparisonSystem,
    },
  });

  function handleSubmit(values: typeof form.values) {
    setErrorBound(values.errorBound);
    setSamplingRate(values.samplingRate);
    setComparisonSystem(values.comparisonSystem);
    close();
  }

  return (
    <Container fluid p={0} mt={20}>
      <form
        onSubmit={form.onSubmit((values) => {
          handleSubmit(values);
        })}
      >
        <NativeSelect
          label="Comparison System"
          description="The system to compare against ModelarDB"
          multiple={false}
          data={[
            { value: "tsfile", label: "Apache TsFile" },
            { value: "parquet", label: "Apache Parquet" },
          ]}
          key={form.key("comparisonSystem")}
          {...form.getInputProps("comparisonSystem")}
        />

        <NumberInput
          mt={25}
          label="ModelarDB Error Bound"
          description="The relative error bound used to compress data in ModelarDB"
          min={0}
          max={100}
          suffix="%"
          allowDecimal={false}
          key={form.key("errorBound")}
          {...form.getInputProps("errorBound")}
        />

        <NumberInput
          mt={25}
          label="Sampling Rate"
          description="The number of data points to ingest per second"
          min={100}
          max={10000}
          step={100}
          suffix=" Hz"
          allowDecimal={false}
          key={form.key("samplingRate")}
          {...form.getInputProps("samplingRate")}
        />

        <Group justify="flex-end" mt={40} me={20}>
          <Button type="submit">Restart</Button>
        </Group>
      </form>
    </Container>
  );
}
