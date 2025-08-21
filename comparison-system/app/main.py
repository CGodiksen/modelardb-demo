import os
import time

import pyarrow as pa
import pyarrow.flight
from pyarrow import RecordBatch
from pyarrow._flight import (ServerCallContext, FlightDescriptor, MetadataRecordBatchReader, FlightMetadataWriter,
                             Ticket, Action)

from minio import Minio
from pyarrow import parquet
from pyarrow import orc


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
        elif action.type == "ingest_data_parquet":
            self.do_ingest_data_parquet(action)
        elif action.type == "ingest_data_orc":
            self.do_ingest_data_orc(action)
        else:
            raise NotImplementedError(f"Action '{action.type}' is not implemented.")

    def list_actions(self, context: ServerCallContext):
        return [("reset_node", "Reset the node"), ("flush_node", "Flush the node"),
                ("ingest_data_parquet", "Ingest data into Apache Parquet"),
                ("ingest_data_orc", "Ingest data into Apache ORC")]

    def do_reset_node(self):
        for file in os.listdir("data"):
            file_path = os.path.join("data", file)
            os.remove(file_path)

            for minio_object in self.minio_client.list_objects("comparison", recursive=True):
                self.minio_client.remove_object("comparison", minio_object.object_name)

    def do_flush_node(self):
        for file in os.listdir("data"):
            file_path = os.path.join("data", file)
            self.minio_client.fput_object("comparison", f"tables/{file}", file_path)

            os.remove(file_path)

    @staticmethod
    def do_ingest_data_parquet(action: Action):
        with pa.ipc.open_stream(action.body) as reader:
            batches: list[RecordBatch] = [batch for batch in reader]

            table = pa.Table.from_batches(batches)
            parquet.write_table(table, f"data/{time.time_ns() // 1_000_000}.parquet")

    @staticmethod
    def do_ingest_data_orc(action: Action):
        with pa.ipc.open_stream(action.body) as reader:
            batches: list[RecordBatch] = [batch for batch in reader]

            table = pa.Table.from_batches(batches)
            orc.write_table(table, f"data/{time.time_ns() // 1_000_000}.orc")


if __name__ == '__main__':
    port = os.environ["FLIGHT_PORT"]
    location = f"grpc://0.0.0.0:{port}"

    server = FlightServer(location=location)
    server.serve()
