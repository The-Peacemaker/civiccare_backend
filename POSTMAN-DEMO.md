# CivicCare API — Postman Demo Requests

Base URL: `http://localhost:5000`

---

## 1. Health Check

**GET** `http://localhost:5000/api/health`

---

## 2. Report Complaint (Anonymous)

**POST** `http://localhost:5000/api/complaints`

Body → raw → JSON:

```json
{
  "title": "Pothole on MG Road",
  "description": "Large pothole causing accidents near bus stop",
  "category": "road",
  "location": "MG Road, Kochi",
  "isAnonymous": true
}
```

Expected: `201 Created` — copy the `_id` from the response for requests 4–5.

---

## 3. List All Complaints

**GET** `http://localhost:5000/api/complaints`

Expected: `200 OK` — complaint from Request 2 appears in `items`.

---

## 4. Update Status

**PATCH** `http://localhost:5000/api/complaints/<PASTE_ID_HERE>`

Body → raw → JSON:

```json
{
  "status": "in-progress"
}
```

Expected: `200 OK` — `"status": "in-progress"`.

---

## 5. Validation Demo

**POST** `http://localhost:5000/api/complaints`

Body → raw → JSON:

```json
{
  "description": "missing title and location"
}
```

Expected: `400 Bad Request` — `"title is required"`.
