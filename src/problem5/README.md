# Problem 5 · A Crude Server

This folder contains an ExpressJS CRUD API implemented with TypeScript and a lightweight JSON-file datastore.

## Prerequisites
- Node.js 18 or newer

## Setup
```bash
npm install
```

## Development
```bash
npm run dev
```
The development server uses `ts-node-dev` for live reload at `http://localhost:4000` by default.

Once running, the generated OpenAPI spec is available at `http://localhost:4000/openapi.json` with interactive docs at `http://localhost:4000/docs`.

## Production build
```bash
npm run build
npm start
```
The compiled output lives in `dist/`.

## API overview
All endpoints share the `/api/resources` base path.

| Method | Path | Description |
| ------ | ---- | ----------- |
| `GET` | `/health` | Health probe returning service status |
| `GET` | `/api/resources` | List resources with optional filters `search`, `tag`, `updatedAfter` |
| `POST` | `/api/resources` | Create a resource (`name` required, optional `description`, `tags[]`) |
| `GET` | `/api/resources/:id` | Fetch a single resource |
| `PUT` | `/api/resources/:id` | Update resource fields (any combination of `name`, `description`, `tags`) |
| `DELETE` | `/api/resources/:id` | Remove a resource |

### Filtering examples
- `GET /api/resources?search=handbook`
- `GET /api/resources?tag=express`
- `GET /api/resources?updatedAfter=2025-01-10T00:00:00.000Z`

### Payload examples
```json
// POST /api/resources
{
  "name": "Component library",
  "description": "UI kit for the dashboard",
  "tags": ["design", "react"]
}
```
```json
// PUT /api/resources/:id
{
  "description": "UI component kit, now with accessibility audits",
  "tags": ["design", "react", "a11y"]
}
```

## Data persistence
Resource records are stored in `data/resources.json`. The repository ships with seed data so the API returns meaningful responses right away.
