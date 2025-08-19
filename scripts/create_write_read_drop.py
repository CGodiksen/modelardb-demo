import modelardb
import pyarrow

from tempfile import TemporaryDirectory

with TemporaryDirectory() as temp_dir:
    # Connect to a local folder.
    local = modelardb.open_local(temp_dir)

    # Create a table in the local folder.
    schema = pyarrow.schema(
        [
            ("timestamp", pyarrow.timestamp("us")),
            ("field_one", pyarrow.float32()),
            ("field_two", pyarrow.float32()),
            ("tag", pyarrow.string()),
        ]
    )

    local.create("time_series_table", modelardb.TimeSeriesTable(schema))

    # Write some data to the table.
    data = pyarrow.RecordBatch.from_pylist(
        [
            {
                "timestamp": 100,
                "field_one": 37.0,
                "field_two": 37.0,
                "tag": "tag_one",
            },
            {
                "timestamp": 100,
                "field_one": 73.0,
                "field_two": 73.0,
                "tag": "tag_two",
            },
        ],
        schema,
    )

    local.write("time_series_table", data)

    # Read the data back from the table.
    print(f"Query result: {local.read("SELECT * FROM time_series_table")}")

    # Clean up the created table.
    local.drop("time_series_table")
    print(f"Tables in local folder: {local.tables()}")
