import modelardb
import pyarrow

from tempfile import TemporaryDirectory

with TemporaryDirectory() as temp_dir:
    # Connect to a cloud node and a local folder.
    modelardbd = modelardb.connect(modelardb.Server("grpc://127.0.0.1:9999"))
    local = modelardb.open_local(temp_dir)

    # Create the "wind" table in the local folder.
    schema = modelardbd.schema("wind")
    local.create("wind", modelardb.NormalTable(schema))

    # Copy data from the cloud to the local folder.
    copy_sql = "SELECT * FROM wind LIMIT 5"
    modelardbd.copy(copy_sql, local, "wind")

    # Execute a query in the local folder and print the result.
    read_sql = "SELECT * FROM wind LIMIT 5"
    print(f"Query result: {local.read(read_sql)}")
