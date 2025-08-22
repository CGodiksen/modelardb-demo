FROM cgodiksen/modelardb

RUN apt-get update

RUN apt-get install -y python3

WORKDIR /usr/src/app

COPY ./requirements.txt /usr/src/app/requirements.txt

RUN pip install --no-cache-dir --upgrade -r /usr/src/app/requirements.txt

COPY ./app /usr/src/app

CMD ["fastapi", "run", "main.py", "--port", "80"]
