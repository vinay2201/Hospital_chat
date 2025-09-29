# MediConnect — Real-Time Hospital Chat

**Stack:** Node.js, WebSockets (Socket.IO), Redis, MongoDB, React

- Live messaging, typing indicators, and user presence
- Redis-backed Socket.IO adapter for horizontal scale
- MongoDB for chat history, rooms, and user metadata
- Responsive React UI

---

## Quickstart (Dev)

```bash
# 0) Prereqs: Node 18+, Docker, Docker Compose
# 1) Start infra
docker compose up -d

# 2) Server
cd server
cp .env.example .env   # fill values if needed
npm i
npm run dev

# 3) Client
cd ../client
npm i
npm run dev
```

Open http://localhost:5173 and login with a display name. Create a room and start chatting.

---

## Features

- Real-time messaging with delivery ACKs
- Presence: online/offline with last-seen
- Typing indicators (per-room)
- Rooms (create/join), message persistence
- Scalable via Redis adapter

---

## Structure

```
mediconnect-realtime-chat/
├─ server/            # Express + Socket.IO + MongoDB + Redis
└─ client/            # React + Vite
```

---

## Docker Services

- **mongo**: MongoDB on 27017
- **redis**: Redis on 6379

Start/stop with `docker compose up -d` / `docker compose down`.

---

## Environment

Server `.env`:
```
PORT=4000
MONGO_URI=mongodb://localhost:27017/mediconnect
REDIS_URL=redis://localhost:6379
CORS_ORIGIN=http://localhost:5173
JWT_SECRET=dev-secret
```

Client `.env` (optional):
```
VITE_API_BASE=http://localhost:4000
VITE_SOCKET_URL=http://localhost:4000
```

---

## Scripts

- `server`: `npm run dev` hot reload; `npm start` production
- `client`: `npm run dev` dev server; `npm run build` production bundle

---

## Notes

- Demo auth: simple display-name login (JWT for session). Replace with SSO/OIDC in production.
- Data model is minimal; extend with ACLs/roles, EHR integration, audit logs, etc.
- HIPAA/PHI: This demo is **not** certified for PHI. Add encryption at rest, access controls, and audit trails before real deployments.
