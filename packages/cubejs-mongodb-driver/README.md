# Testing

Create docker compose file with configuration
```
version: '3.2'
services:
  mongodb:
    image: mongo
    ports:
      - "27017:27017"
    volumes:
      - type: bind
        source: ./artifacts
        target: /artifacts
```

Then create artifacts for the volume
```
mkdir artifacts
```

And place your Donors.csv inside ./artifacts folder
```
mv <path_to_your_Donors.csv> ./artifacts
```

Start mongo container
```
docker-compose up -d
```

Connect to mongo container
```
docker exec -it <container_id> /bin/bash
```

Import Donors to database

```
mongoimport -d test -c donors --type csv --file Donors.csv --headerline
```

Link appropriate packages, and run cube js backend and playground.

Supported operations include WHERE statements with AND and IN operators, COUNT function, GROUP BY, ORDER BY, LIMIT
