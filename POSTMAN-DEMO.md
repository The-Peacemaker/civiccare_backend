# CivicCare API — Postman Demo

Base URL: `http://localhost:5000`

Full collection: `postman/CivicCare-API.postman_collection.json` (import into Postman, run the **Auth** folder first).

## Demo accounts (after `npm run seed`)

| Role | Email | Password | Anonymous handle |
| --- | --- | --- | --- |
| Admin | `admin@civiccare.local` | `password123` | — |
| Authority | `authority@civiccare.local` | `password123` | — |
| Citizen | `john@example.com` | `password123` | Anonymous User 101 |
| Citizen | `sarah@example.com` | `password123` | Anonymous User 202 |
| Citizen | `mike@example.com` | `password123` | Anonymous User 303 |
| Citizen | `david@example.com` | `password123` | Anonymous User 404 |

Guests can also call `POST /api/auth/guest` for a throwaway anonymous session.

## Auth flow

1. `POST /api/auth/login` or `POST /api/auth/register`
2. Copy `data.tokens.accessToken`
3. Send `Authorization: Bearer <accessToken>` on protected routes
4. Refresh with `POST /api/auth/refresh` using `data.tokens.refreshToken`

`GET /api/auth/me` and `GET /api/users/me` return the current profile.

## Main endpoints

| Area | Endpoints |
| --- | --- |
| Auth | `POST /api/auth/register`, `/login`, `/guest`, `/google`, `/refresh`; `GET /api/auth/me` |
| Users | `GET|PATCH /api/users/me`, `GET /api/users/:id` |
| Complaints | `GET|POST /api/complaints`; `GET|PATCH|DELETE /api/complaints/:id`; `POST /:id/upvote`, `/:id/share`; `GET /:id/history`; `GET|POST /:id/comments` |
| Communities | `GET|POST /api/communities`; `GET|PATCH|DELETE /api/communities/:id`; `POST /:id/join` |
| Resources | `GET|POST /api/resources`; `GET|PATCH|DELETE /api/resources/:id` |
| Notifications | `GET|DELETE /api/notifications`; `PATCH /:id/read`, `/read-all`; `DELETE /:id` |
| Stats/Map | `GET /api/stats/overview`, `/engagement`, `/districts`, `/map`; `GET /api/map/pins` |
| Uploads | `POST /api/uploads` (multipart field `photo`, PNG/JPEG/WEBP, 10 MB) |

## Quick checks

```http
GET /api/health
GET /api/complaints?limit=5
GET /api/stats/overview
```

Report a complaint (identity stored, never exposed):

```json
{
  "title": "Pothole on MG Road",
  "description": "Large pothole causing accidents near bus stop",
  "category": "pothole",
  "location": "MG Road, Kochi",
  "coords": { "lat": 9.9312, "lng": 76.2673 },
  "isAnonymous": true
}
```

Expected: `201 Created`. Category aliases such as `pothole`, `bribe` and `garbage` are accepted and normalised.

Validation demo — `POST /api/complaints` with `{"description":"missing title and location"}` returns `400` with `title is required`.

Status/priority updates require an `authority` or `admin` token. The public feed never reveals the author of anonymous reports; `/api/admin/*` returns the full identity trail.
