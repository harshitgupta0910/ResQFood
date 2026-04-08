# ResQFood

ResQFood is a full-stack MERN platform that connects food donors, NGOs, and admins to reduce food waste and deliver edible surplus to people who need it.

It is built for speed, trust, and accountability, with real-time workflows, verification, complaint handling, and transparent impact metrics.

## Why This Project Matters

Every day, large amounts of good food are wasted while many communities remain food insecure.
ResQFood addresses this gap by creating one digital flow for:

- Donors to list surplus food quickly.
- NGOs to discover and claim available food in real time.
- Admins to moderate quality, resolve disputes, and keep the system fair.

## Live Links

- Frontend (Vercel): https://res-q-food-00.vercel.app/
- Backend (Render): https://resqfood-backend-qqap.onrender.com/
- Health Check: https://resqfood-backend-qqap.onrender.com/api/health

## Product Highlights

- Role-based experience for Donor, NGO, and Admin.
- Real-time listing and claim lifecycle updates via Socket.IO.
- OTP-based delivery confirmation to reduce false completion.
- Complaint center with admin-side resolution workflow.
- AI-assisted donor intake and listing support.
- Analytics dashboard to track platform impact.

## Screenshots


### Complete Architechture
![ResQFood Architechture](./WhatsApp Image-2026-)



### Home and Public Experience
![ResQFood Screenshot 1](./i1.png)

### Dashboard and Listings
![ResQFood Screenshot 2](./i2.png)

### Claim and Verification Flow
![ResQFood Screenshot 3](./i3.png)

### Admin and Moderation Views
![ResQFood Screenshot 4](./i4.png)

## Key Modules by Role

### Donor

- Create listings with quantity, freshness, and pickup details.
- Receive claim activity and delivery verification requests.
- Complete delivery through OTP verification.
- Track contributions and interactions.

### NGO

- Browse available listings.
- Claim suitable food listings.
- Track claim status through the lifecycle.
- Raise complaints when needed.

### Admin

- Monitor platform activity.
- Moderate listings and users.
- Manage claim allocation fairness.
- Resolve complaints and enforce platform trust.

## Local Setup

### 1) Clone

```bash
git clone https://github.com/harshitgupta0910/ResQFood.git
cd ResQFood
```

### 2) Install Dependencies

```bash
cd server
npm install
cd ../client
npm install
```

### 3) Configure Environment Variables

Create these files:

- server/.env
- client/.env (recommended)

### 4) Run Backend

```bash
cd server
npm run dev
```

### 5) Run Frontend

```bash
cd client
npm run dev
```

Default local URLs:

- Frontend: http://localhost:5173
- Backend: http://localhost:5000

## Environment Variables

### Backend (server/.env)

Required:

```env
PORT=5000
NODE_ENV=development
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
JWT_EXPIRE=7d
CLIENT_URL=http://localhost:5173
BACKEND_BASE_URL=http://localhost:5000
```

Email and OTP:

```env
EMAIL_HOST=
EMAIL_PORT=587
EMAIL_USER=
EMAIL_PASS=
EMAIL_FROM_NAME=ResQFood
EMAIL_FROM=
```

Cloudinary:

```env
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
```

Optional AI and Maps:

```env
OPEN_ROUTER=
OPEN_ROUTER_MODEL=google/gemini-2.5-flash
GEMINI_API_KEY=
GOOGLE_MAPS_API_KEY=
ELEVENLABS_API_KEY=
ELEVENLABS_VOICE_ID=
```

### Frontend (client/.env)

```env
VITE_SERVER_URL=http://localhost:5000
```

Optional direct API override:

```env
VITE_API_BASE_URL=http://localhost:5000/api
```

API base selection in frontend:

1. Use VITE_API_BASE_URL if set.
2. Otherwise use /api in development.
3. Otherwise use VITE_SERVER_URL + /api in production.

## Scripts

### Backend

- npm run dev: start server with nodemon
- npm start: production start
- npm run seed: run seed script

### Frontend

- npm run dev: start Vite dev server
- npm run build: production build
- npm run preview: preview production build
- npm run lint: lint source code

## API Overview

Base path: /api

Route groups:

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

Health endpoint:

- GET /api/health

## Deployment Notes

### Backend (Render)

- Root Directory: server
- Build Command: npm install
- Start Command: npm start

Important:

- CLIENT_URL should match your frontend domain.
- BACKEND_BASE_URL should match your backend public URL.

### Frontend (Vercel)

- Framework: Vite
- Root Directory: client
- Install Command: npm install
- Build Command: npm run build
- Output Directory: dist

Required env:

- VITE_SERVER_URL=https://resqfood-backend-qqap.onrender.com

## Troubleshooting

### 404 on Login or Signup in Production

- Verify VITE_SERVER_URL in Vercel.
- Redeploy frontend after env updates.
- Verify backend CORS CLIENT_URL matches your frontend domain.

### Render Root URL Shows Not Found

- Expected behavior if / is not defined.
- Use /api/health or other /api endpoints.

### CORS Errors

- Check CLIENT_URL value in backend env.
- Restart/redeploy backend after changes.

### Socket Connection Delays

- Free-tier cold starts can delay first connection.
- Keep backend active for better real-time responsiveness.

## Security Notes

- Do not commit real .env values.
- Use strong JWT secrets.
- Rotate third-party API keys periodically.

## License

This project is currently unlicensed. Add a LICENSE file before public distribution if needed.
