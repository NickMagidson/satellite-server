# Satellite Server

Small Express API that reads satellite OMM JSON, validates each record, converts it into a `satellite.js` satrec, and keeps current geodetic positions refreshed once per second.

## Setup

```sh
npm install
npm run build
npm start
```

By default the server runs on `http://localhost:3000` and loads `data/omm.sample.json`.

For development, run the TypeScript source directly:

```sh
npm run dev
```

Check types without emitting compiled files:

```sh
npm run typecheck
```

Use your own OMM file:

```sh
OMM_FILE=/absolute/path/to/omms.json npm start
```

Change the update interval:

```sh
UPDATE_INTERVAL_MS=1000 npm start
```

## Run with Docker Compose

Copy `.env.example` to `.env` if you want to override the defaults, then start the API and Postgres:

```sh
docker compose up -d --build
curl http://localhost:3000/health
docker compose ps
```

The compose setup keeps the current OMM file behavior by defaulting `OMM_FILE` to `/app/data/omm.sample.json` inside the API container. Postgres is available to the API through `DATABASE_URL`, but the app does not connect to it yet.

## Make targets

```sh
make help
make install
make dev
make up
make down
make logs
make clean
```

## OMM JSON Shape

The server accepts:

- a single OMM object
- an array of OMM objects
- `{ "satellites": [ ... ] }`

Each OMM must include `NORAD_CAT_ID`; `satellite.js` uses it when creating the propagated satellite record.

## Endpoints

```txt
GET  /health
GET  /api/satellites
GET  /api/satellites/positions
GET  /api/satellites/positions?at=2026-01-01T00:00:00Z
GET  /api/satellites/:id/position
GET  /api/satellites/:id/position?at=2026-01-01T00:00:00Z
POST /api/satellites/omms
```

`GET /api/satellites` returns satellite metadata:

```json
{
  "count": 1,
  "satellites": [
    {
      "id": "28492",
      "name": "HELIOS 2A",
      "noradCatId": 28492,
      "objectId": "2004-049A",
      "epoch": "2025-03-26T05:19:34.116960",
      "classification": "U",
      "meanMotion": 15.00555103,
      "inclinationDeg": 98.3164,
      "eccentricity": 0.000583
    }
  ]
}
```

`GET /api/satellites/positions` returns the latest one-second cached positions.

`GET /api/satellites/positions?at=2026-01-01T00:00:00Z` propagates all satellites at the requested UTC timestamp without changing the live cache.

```json
{
  "updatedAt": "2026-05-29T12:00:00.000Z",
  "propagatedAt": "2026-05-29T12:00:00.000Z",
  "updateIntervalMs": 1000,
  "count": 1,
  "positions": [
    {
      "id": "28492",
      "name": "HELIOS 2A",
      "status": "ok",
      "propagatedAt": "2026-05-29T12:00:00.000Z",
      "geodetic": {
        "latitudeDeg": 12.34,
        "longitudeDeg": -56.78,
        "altitudeKm": 701.23
      },
      "eci": {
        "xKm": 1234.56,
        "yKm": 2345.67,
        "zKm": 3456.78
      },
      "ecf": {
        "xKm": 1234.56,
        "yKm": 2345.67,
        "zKm": 3456.78
      },
      "velocityEci": {
        "xKmPerSec": 1.23,
        "yKmPerSec": 2.34,
        "zKmPerSec": 3.45
      }
    }
  ]
}
```

`POST /api/satellites/omms` lets a front end replace the active OMM set at runtime by sending one of the accepted OMM JSON shapes.

Invalid OMM payloads return `400` with structured validation details.
