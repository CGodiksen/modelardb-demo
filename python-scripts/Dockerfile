FROM cgodiksen/modelardb

RUN apt-get update

RUN apt-get install -y python3-pip

WORKDIR /usr/src/app

COPY ./requirements.txt /usr/src/app/requirements.txt

RUN pip install --no-cache-dir --upgrade --break-system-packages -r /usr/src/app/requirements.txt

COPY ./app /usr/src/app

copy ./scripts /usr/src/app/crates/modelardb_embedded/bindings/python

CMD ["fastapi", "run", "main.py", "--port", "80"]
