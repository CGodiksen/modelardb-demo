# ModelarDB Demo
This repository contains a demonstration of running a ModelarDB cluster in a distributed fashion. The demo is built using
Tauri and React. The demo is intended to be used as a proof of concept for the ModelarDB system and to show how it can be
used in a real-world scenario. The code in this repository is not intended to be used in a production environment.

## Setup
1. In the root of the repository, run the following command to set up the MinIO object store, the nodes, and the
   utility service used for running Python scripts. Note that it takes around 10 seconds for the services to start.
```shell
docker-compose -p modelardb-cluster -f docker-compose-cluster.yml up
```
2. Set up the [Google Maps JavaScript API](https://developers.google.com/maps/documentation/javascript) and 
   [get an API key](https://developers.google.com/maps/documentation/javascript/get-api-key).
3. Set the `GOOGLE_MAPS_API_KEY` environment variable to your API key.
4. Download the latest release of the demo from the [releases page](https://github.com/CGodiksen/modelardb-demo/releases).
5. Run the downloaded release and start the executable.

## ModelarDB resources
- [ModelarDB GitHub Repository](https://github.com/ModelarData/ModelarDB-RS)
- [ModelarDB Papers](https://github.com/skejserjensen/ModelarDB?tab=readme-ov-file#papers)
- [ModelarDB Presentations](https://github.com/skejserjensen/ModelarDB?tab=readme-ov-file#presentations)
