# ResQFood

ResQFood is a full-stack MERN platform that helps donors, NGOs, and admins redistribute surplus food quickly, fairly, and transparently.

It includes:
- Real-time listing and claim workflows
- OTP-based delivery confirmation
- Complaint reporting and admin resolution
- AI-assisted donor intake and listing support
- Analytics dashboards for impact tracking

## Live Deployment

- Frontend (Vercel): https://res-q-food-00.vercel.app/
- Backend (Render): https://resqfood-backend-qqap.onrender.com/
- Health check: https://resqfood-backend-qqap.onrender.com/api/health

## Monorepo Structure

This repository contains two apps:

- client: React + Vite frontend
- server: Node.js + Express + MongoDB backend

High-level structure:

- client/src/pages: Role-based app pages (donor, ngo, admin, auth)
- client/src/components: Reusable UI/layout/components
- client/src/services/api.js: HTTP client and API modules
- server/routes: REST API route definitions
- server/controllers: API business logic
- server/models: Mongoose schemas
- server/services: AI, email, routing, fairness, notifications
- server/jobs: Background jobs (expiry checks, claim verification)
- server/sockets: Socket.IO auth and events

## Core Features

### Donor

- Create food listings with photos and metadata
- Manage own listings
- Track received claims
- Send and verify delivery OTP
- View impact dashboard
- Submit complaints against connected NGO interactions

### NGO

- Browse live feed and claim listings
- Confirm claims through verification flow
- Track claim lifecycle
- Submit complaints against donor interactions

### Admin

- Live monitoring dashboard
- User and organization management
- Listing moderation
- Claim allocation control
- Complaint and safety resolution center

### Shared Platform

- JWT authentication and role-based access control
- Notification APIs
- Real-time socket updates
- Public analytics overview

## Tech Stack

### Frontend

- React 19
- React Router
- Axios
- Zustand
- React Query
- Tailwind CSS 4
- Socket.IO client
- Vite

### Backend

- Node.js + Express
- MongoDB + Mongoose
- JWT auth
- Socket.IO
- Nodemailer
- Multer + Cloudinary
- Gemini/OpenRouter integrations

## Local Development Setup

## 1) Clone

- git clone https://github.com/harshitgupta0910/ResQFood.git
- cd ResQFood

## 2) Install dependencies

- cd server
- npm install
- cd ../client
- npm install

## 3) Configure environment variables

Create environment files:

- server/.env
- client/.env (optional for local, recommended)

## 4) Run backend

From server folder:

- npm run dev

## 5) Run frontend

From client folder:

- npm run dev

Default local ports:

- Frontend: https://res-q-food-00.vercel.app
- Backend: https://resqfood-backend-qqap.onrender.com

## Environment Variables

## Backend (server/.env)

Required:

- PORT=5000
- NODE_ENV=development
- MONGO_URI=your_mongodb_connection_string
- JWT_SECRET=your_jwt_secret
- JWT_EXPIRE=7d
- CLIENT_URL=https://res-q-food-00.vercel.app
- BACKEND_BASE_URL=https://resqfood-backend-qqap.onrender.com

Email/OTP:

- EMAIL_HOST=
- EMAIL_PORT=587
- EMAIL_USER=
- EMAIL_PASS=
- EMAIL_FROM_NAME=ResQFood
- EMAIL_FROM=

Cloud storage:

- CLOUDINARY_CLOUD_NAME=
- CLOUDINARY_API_KEY=
- CLOUDINARY_API_SECRET=

AI and maps (optional based on features used):

- OPEN_ROUTER=
- OPEN_ROUTER_MODEL=google/gemini-2.5-flash
- GEMINI_API_KEY=
- GOOGLE_MAPS_API_KEY=
- ELEVENLABS_API_KEY=
- ELEVENLABS_VOICE_ID=

## Frontend (client/.env)

Recommended for production-like local testing:

- VITE_SERVER_URL=https://resqfood-backend-qqap.onrender.com

Optional explicit API base override:

- VITE_API_BASE_URL=https://resqfood-backend-qqap.onrender.com/api

Note: client/src/services/api.js automatically selects API base using:

1. VITE_API_BASE_URL if provided
2. /api in development
3. VITE_SERVER_URL + /api in production

## NPM Scripts

## Backend

- npm run dev: start with nodemon
- npm start: production start
- npm run seed: seed script

## Frontend

- npm run dev: Vite dev server
- npm run build: production build
- npm run preview: preview build
- npm run lint: lint source

## API Overview

Base URL: /api

Main route groups:

- /api/auth
- /api/users
- /api/listings
- /api/claims
- /api/pickups
- /api/analytics
- /api/admin
- /api/utils
- /api/ratings
- /api/complaints
- /api/notifications

Health:

- GET /api/health

## Deployment Guide

## Backend on Render (Web Service)

Settings:

- Root Directory: server
- Build Command: npm install
- Start Command: npm start

Set environment variables from the Backend section above.

Important:

- CLIENT_URL must be your frontend production domain
- BACKEND_BASE_URL must be your Render backend URL

## Frontend on Vercel

Settings:

- Framework: Vite
- Root Directory: client
- Install Command: npm install
- Build Command: npm run build
- Output Directory: dist

Environment variables:

- VITE_SERVER_URL=https://resqfood-backend-qqap.onrender.com

Vercel config is already included in client/vercel.json for SPA route handling.

## Troubleshooting

## Signup/Login returns 404 on Vercel

Cause:

- Frontend calls wrong API origin.

Fix:

- Ensure VITE_SERVER_URL is set in Vercel.
- Redeploy frontend.
- Ensure backend CLIENT_URL equals your Vercel domain.

## Route / not found on Render backend URL

Cause:

- Backend root route is not defined.

Fix:

- This is expected. Use /api/health or /api/* endpoints.

## CORS issues

Fix:

- Set CLIENT_URL correctly in Render env.
- Redeploy backend after env change.

## Socket connection issues in production

Fix:

- Keep VITE_SERVER_URL set to Render backend URL.
- Ensure backend is up and not sleeping (free tier cold starts can delay first request).

## Security and Operations Notes

- Never commit real .env values.
- Use strong JWT secrets.
- Rotate API keys periodically.
- Use paid instances for lower cold-start latency in production workloads.

## License

This project is currently unlicensed. Add a LICENSE file if you plan public reuse/distribution.
