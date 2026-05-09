# Team Task Manager (MERN)

Full-stack MERN web app to manage **projects**, **team members**, and **tasks** with **role-based access**.

## Features

- **Auth**: Signup/Login/Logout (JWT in httpOnly cookie)
- **Projects**: Create projects and view only projects you’re a member of
- **Team management**: Invite members by email (Admin-only), set member role (Admin/Member)
- **Tasks**: Create tasks, assign to members, update status (TODO / IN_PROGRESS / DONE), due dates
- **Dashboard**: Assigned tasks summary + overdue list

## Tech Stack

- **Client**: React + Vite + TypeScript
- **Server**: Node.js + Express
- **DB**: MongoDB (Mongoose)
- **Deploy**: Railway (single service; server serves React build)

## Local Setup

### 1) Install

```bash
npm install
```

### 2) Configure env

Create `.env` in the repo root (you can copy from `.env.example`):

- `MONGODB_URI`
- `JWT_SECRET`
- `CORS_ORIGIN` (optional for local dev, default allows Vite proxy)

### 3) Run (dev)

```bash
npm run dev
```

- Client: `http://localhost:5173`
- API: `http://localhost:3001/api/health`

## REST API (high level)

- `POST /api/auth/signup`
- `POST /api/auth/login`
- `POST /api/auth/logout`
- `GET  /api/auth/me`
- `GET  /api/projects`
- `POST /api/projects` (creates project + makes creator ADMIN)
- `GET  /api/projects/:projectId`
- `POST /api/projects/:projectId/members` (ADMIN only)
- `GET  /api/tasks/project/:projectId`
- `POST /api/tasks`
- `PATCH /api/tasks/:taskId`
- `DELETE /api/tasks/:taskId` (ADMIN only)
- `GET  /api/dashboard`

## Railway Deployment (mandatory)

### MongoDB

Use one of:
- Railway MongoDB plugin, or
- MongoDB Atlas (recommended for quick setup)

### App service

1. Create a new Railway project and connect this GitHub repo.
2. Set variables:
   - `MONGODB_URI`
   - `JWT_SECRET`
   - `NODE_ENV=production`
3. Railway will run:
   - **Install**: `npm install` (runs `postinstall` to install `server/` and `client/`)
   - **Build**: `npm run build` (builds React to `client/dist`)
   - **Start**: `npm start` (starts Express server)

When deployed, the Express server serves the React app from the same domain.

## Demo video (2–5 min)

Suggested flow:
- Signup/login
- Create a project (you become ADMIN)
- Invite a second user (MEMBER)
- Create tasks, assign, change statuses, show overdue
- Open dashboard

