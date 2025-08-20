import pyarrow as pa
import pyarrow.flight


class FlightServer(pa.flight.FlightServerBase):
    def __init__(self, location="grpc://0.0.0.0:8800", **kwargs):
        super(FlightServer, self).__init__(location, **kwargs)
        self._location = location

    def list_flights(self, context, criteria):
        raise NotImplementedError("list_flights is not implemented.")

    def get_flight_info(self, context, descriptor):
        raise NotImplementedError("get_flight_info is not implemented.")

    def do_put(self, context, descriptor, reader, writer):
        raise NotImplementedError("do_put is not implemented.")

    def do_get(self, context, ticket):
        raise NotImplementedError("do_get is not implemented.")

    def do_action(self, context, action):
        if action.type == "reset_node":
            self.reset_node(context, action)
        elif action.type == "flush_node":
            self.flush_node(context, action)
        else:
            raise NotImplementedError(f"Action '{action.type}' is not implemented.")

    def list_actions(self, context):
        return ["reset_node", "flush_node"]

    def reset_node(self, context, action):
        print("Resetting node...")

    def flush_node(self, context, action):
        print("Flushing node...")
