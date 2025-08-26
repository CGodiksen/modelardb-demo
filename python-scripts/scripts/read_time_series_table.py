import modelardb

from datetime import datetime, timedelta

# Connect to a cloud node.
modelardbd_cloud = modelardb.connect(modelardb.Server("grpc://host.docker.internal:9999"))

# Query the cloud node using a convenience function.
now = datetime.now()
result = modelardbd_cloud.read_time_series_table(
    "wind",
    columns=["timestamp", "active_power", "park_id", "windmill_id"],
    tags={"park_id": "park_1", "windmill_id": "windmill_1"},
    start_time=now - timedelta(seconds=60),
    end_time=now,
)

print(result)
