# Testing

Create

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

Create 

`mongoimport -d test -c donors --type csv --file Donors.csv --headerline`
