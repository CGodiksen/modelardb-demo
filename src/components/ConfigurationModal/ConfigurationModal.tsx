import {
  Button,
  Container,
  Group,
  NativeSelect,
  NumberInput,
} from "@mantine/core";
import { useForm } from "@mantine/form";

type ConfigurationModalProps = {
  close: () => void;
};

export function ConfigurationModal({ close }: ConfigurationModalProps) {
  const form = useForm({
    mode: "uncontrolled",
    initialValues: {
      error_bound: 5,
      sampling_rate: 1000,
      comparison_system: "tsfile",
    },
  });

  return (
    <Container fluid p={0} mt={20}>
      <form
        onSubmit={form.onSubmit((values) => {
          console.log(values);
          close();
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
          key={form.key("comparison_system")}
          {...form.getInputProps("comparison_system")}
        />

        <NumberInput
          mt={25}
          label="ModelarDB Error Bound"
          description="The relative error bound used to compress data in ModelarDB"
          min={0}
          max={100}
          suffix="%"
          allowDecimal={false}
          key={form.key("error_bound")}
          {...form.getInputProps("error_bound")}
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
          key={form.key("sampling_rate")}
          {...form.getInputProps("sampling_rate")}
        />

        <Group justify="flex-end" mt={40} me={20}>
          <Button type="submit">Restart</Button>
        </Group>
      </form>
    </Container>
  );
}
