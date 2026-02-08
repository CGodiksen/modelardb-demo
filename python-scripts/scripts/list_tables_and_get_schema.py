import modelardb

# Connect to an edge node.
modelardbd = modelardb.connect("grpc://modelardb-edge-1:9981")

# List all tables in the edge node.
tables = modelardbd.tables()
print(f"Tables in edge node: {tables}")

# Get the schema of a specific table.
schema = modelardbd.schema("wind")
print(f"Schema for 'wind' table: {schema}")
