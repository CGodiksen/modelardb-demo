import subprocess

from typing import Union

from fastapi import FastAPI

app = FastAPI()


@app.get("/run")
def run_python_script(script: Union[str, None] = None):
    if script is None:
        script = "query_edge_and_cloud.py"

    result = subprocess.run(["python3", script], cwd="crates/modelardb_embedded/bindings/python",
                            capture_output=True, text=True)

    return {"output": result.stdout, "error": result.stderr, "code": result.returncode}


@app.get("/read")
def get_python_script(script: Union[str, None] = None):
    if script is None:
        script = "query_edge_and_cloud.py"

    try:
        with open(f"crates/modelardb_embedded/bindings/python/{script}", "r") as file:
            content = file.read()
        return {"script": content}
    except FileNotFoundError:
        return {"error": "Script not found"}
