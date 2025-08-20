import os
import time

import pyarrow as pa
import pyarrow.parquet as pq
import pyarrow.flight
from pyarrow import RecordBatch
from pyarrow._flight import (ServerCallContext, FlightDescriptor, MetadataRecordBatchReader, FlightMetadataWriter,
                             Ticket, Action)

from minio import Minio


class FlightServer(pa.flight.FlightServerBase):
    def __init__(self, location: str, **kwargs):
        super(FlightServer, self).__init__(location, **kwargs)
        self._location = location

        self.minio_client = Minio("minio-server:9000", access_key="minioadmin", secret_key="minioadmin",
                                  secure=False, region="eu-central-1")

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
        for file in os.listdir("data"):
            file_path = os.path.join("data", file)
            self.minio_client.fput_object("comparison", file, file_path)

            os.remove(file_path)

    def do_ingest_data(self, action: Action):
        with pa.ipc.open_stream(action.body) as reader:
            batches: list[RecordBatch] = [batch for batch in reader]

            table = pa.Table.from_batches(batches)
            pq.write_table(table, f"data/{time.time_ns() // 1_000_000}.parquet")


if __name__ == '__main__':
    port = os.environ["FLIGHT_PORT"]
    location = f"grpc://0.0.0.0:{port}"

    server = FlightServer(location=location)
    server.serve()
