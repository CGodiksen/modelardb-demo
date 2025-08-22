import modelardb

sql = "SELECT timestamp, active_power FROM wind LIMIT 5"

# Connect to an edge node and a cloud node.
modelardbd_edge = modelardb.connect(modelardb.Server("grpc://127.0.0.1:9981"))
modelardbd_cloud = modelardb.connect(modelardb.Server("grpc://127.0.0.1:9999"))

# Query the edge node.
print(f"Edge query result: {modelardbd_edge.read(sql)}")

# Query the cloud node.
print(f"Cloud query result: {modelardbd_cloud.read(sql)}")
