# Willow

Willow is a full-stack music identity app that turns Spotify listening data into shareable insight cards, AI-generated personality copy, and public snapshot pages.

## Stack

- Frontend: React, Vite, Tailwind CSS, Framer Motion
- Backend: Node.js, Express
- Database: MongoDB Atlas
- Auth: Spotify OAuth Authorization Code flow
- Session/Auth: HTTP-only cookies with cross-domain credentials
- Image generation: html-to-image for share cards

## Project Structure

- `client/` - Vite frontend
- `server/` - Express API
- `prd.md` - product requirements
- `deployment.txt` - deployment checklist

## Main Features

- Spotify login and cookie-based session auth
- Personal dashboard with top tracks, top artists, genres, and taste drift
- AI-generated personality insight text branded with Willow
- Public snapshot sharing
- Instagram-friendly story export on mobile

## Local Development

### Backend

```bash
cd server
npm install
npm run dev
```

### Frontend

```bash
cd client
npm install
npm run dev
```

## Required Environment Variables

### Backend

- `NODE_ENV`
- `PORT`
- `MONGODB_URI`
- `FRONTEND_URL`
- `SPOTIFY_CLIENT_ID`
- `SPOTIFY_CLIENT_SECRET`
- `SPOTIFY_REDIRECT_URI`
- `ACCESS_TOKEN_SECRET`
- `REFRESH_TOKEN_SECRET`
- `TRUST_PROXY=1` in production

### Frontend

- `VITE_API_BASE_URL` (without `/api`)

## Production Deployment

### Backend on Render

- Root directory: `server`
- Build command: `npm install`
- Start command: `npm start`
- Set all backend environment variables
- Use the exact Vercel frontend URL in `FRONTEND_URL`

### Frontend on Vercel

- Root directory: `client`
- Build command: `npm run build`
- Output directory: `dist`
- `vercel.json` lives inside `client/` (the configured Root Directory) so Vercel picks up the SPA rewrites
- Set `VITE_API_BASE_URL` to the Render backend URL (without `/api`)

### Spotify OAuth

Set the Spotify redirect URI to the exact backend callback URL, for example:

```text
https://your-backend.onrender.com/api/auth/spotify/callback
```

## Notes for Production Safety

- Frontend and backend must use HTTPS in production
- Cookies must remain HTTP-only, secure, and cross-domain compatible
- Frontend requests must send credentials
- Backend CORS must allow only the exact frontend origin
- Do not use localhost values in production env vars

## Useful API Routes

- `GET /api/user/me`
- `GET /api/me`
- `GET /api/top`
- `POST /api/auth/spotify/login`
- `GET /api/auth/spotify/callback`
- `POST /api/auth/logout`
- `GET /api/share/:shareId`
- `POST /api/share`
- `DELETE /api/share/:shareId`
- `GET /api/og/:shareId`
- `POST /api/ai/review`

## Troubleshooting

- If login loops, check `SPOTIFY_REDIRECT_URI`, `FRONTEND_URL`, and cookie settings
- If API calls 401 after login, verify cookies are being sent with credentials
- If CORS fails, verify the backend origin whitelist exactly matches the Vercel domain
- If deployment fails, confirm all production env vars are present before startup
