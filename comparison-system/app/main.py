import os

import pyarrow as pa
import pyarrow.flight
from pyarrow._flight import (ServerCallContext, FlightDescriptor, MetadataRecordBatchReader, FlightMetadataWriter,
                             Ticket, Action)


class FlightServer(pa.flight.FlightServerBase):
    def __init__(self, location: str, **kwargs):
        super(FlightServer, self).__init__(location, **kwargs)
        self._location = location

    def list_flights(self, context: ServerCallContext, criteria: bytes):
        raise NotImplementedError("list_flights is not implemented.")

    def get_flight_info(self, context: ServerCallContext, descriptor: FlightDescriptor):
        raise NotImplementedError("get_flight_info is not implemented.")

    def do_put(self, context: ServerCallContext, descriptor: FlightDescriptor, reader: MetadataRecordBatchReader,
               writer: FlightMetadataWriter):
        raise NotImplementedError("do_put is not implemented.")

    def do_get(self, context: ServerCallContext, ticket: Ticket):
        raise NotImplementedError("do_get is not implemented.")

    def do_action(self, context: ServerCallContext, action: Action):
        if action.type == "reset_node":
            self.do_reset_node()
        elif action.type == "flush_node":
            self.do_flush_node()
        elif action.type == "ingest_data":
            self.do_ingest_data(action)
        else:
            raise NotImplementedError(f"Action '{action.type}' is not implemented.")

    def list_actions(self, context: ServerCallContext):
        return [("reset_node", "Reset the node"), ("flush_node", "Flush the node"),
                ("ingest_data", "Ingest data into the node")]

    def do_reset_node(self):
        print("Resetting node...")

    def do_flush_node(self):
        print("Flushing node...")

    def do_ingest_data(self, action: Action):
        with pa.ipc.open_stream(action.body) as reader:
            schema = reader.schema
            batches = [b for b in reader]
            print(f"Ingested {len(batches)} batches with schema: {schema}")

            for batch in batches:
                print(f"Batch: {batch}")


if __name__ == '__main__':
    port = os.environ["FLIGHT_PORT"]
    location = f"grpc://0.0.0.0:{port}"

    server = FlightServer(location=location)
    server.serve()
