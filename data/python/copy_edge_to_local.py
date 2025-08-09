import modelardb

# Connect to an edge node and a local folder.
modelardbd = modelardb.connect(modelardb.Server("grpc://127.0.0.1:9981"))
local = modelardb.open_local()

# Copy data from the edge to the local folder.
copy_sql = "SELECT * FROM wind"
modelardbd.copy(copy_sql, local, "wind")

# Execute a query in the local folder and print the result.
read_sql = "SELECT timestamp, active_power FROM wind LIMIT 5"
print(local.read(read_sql))
