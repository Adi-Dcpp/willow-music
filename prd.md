# PRD — Willow — Every Era Has a Sound (Stats + Share Cards + Group Playlist)

**Document owner:** You  
**Last updated:** 2026-04-17  
**Status:** Draft (v1)

## 1. Summary
Willow is a web app that lets users log in with Spotify, view their listening “identity” across time ranges (last 4 weeks / last 6 months / all time), generate shareable public pages and social cards, and optionally create playlists from insights. Tagline: “Every Era Has a Sound.” A “Group Mode” enables multiple users to generate a combined playlist for parties or friend groups.

This project is designed to be:
- **Fun + shareable** (public links + OG images)
- **Useful** (quick stats + playlist creation)
- **Resume-worthy** (OAuth, API integration, caching, rate limiting, deployment, data modeling, security)

## 2. Goals & Non-goals

### 2.1 Goals
- Provide a clean dashboard for Spotify “top” stats by time range.
- Generate a **public share link** with an attractive, consistent design.
- Generate **share images** (Open Graph + downloadable PNG).
- Create playlists from top tracks and/or recommendations.
- Support “Group Mode” to combine multiple users’ tastes into one playlist.
- Ship a stable MVP that real users can use (you + friends initially, optionally public).

### 2.2 Non-goals (v1)
- Full “Spotify Wrapped” clone with year-end narratives.
- Real-time listening tracking (Spotify does not provide complete real-time listening history in a simple way).
- Messaging/chat inside the app (Group Mode will use share links + join flow only).
- Mobile native app (web-first).

## 3. Personas
1. **Casual Listener (Primary)**
   - Wants fun stats and a shareable card in under 1 minute.
2. **Playlist Curator**
   - Wants to quickly generate playlists based on vibe/time range.
3. **Friend Group / Party Host**
   - Wants one playlist everyone likes for a hangout.
4. **Power User**
   - Wants comparisons across time ranges and deeper insights.

## 4. Key Use Cases (User Stories)
### 4.1 Login + Dashboard
- As a user, I can log in with Spotify.
- As a user, I can view my **top artists** and **top tracks** for 3 time ranges.
- As a user, I can switch between time ranges instantly (cached).

### 4.2 Shareable Profile Snapshot
- As a user, I can generate a share link that shows a snapshot of my stats.
- As a visitor, I can open a share link without logging in.
- As a user, I can revoke/delete a share link.

### 4.3 Share Cards / Images
- As a user, I can view an auto-generated share image and download it.
- As a visitor, when I paste my share link into social apps, it shows a nice preview (OG image).

### 4.4 Playlist Creation
- As a user, I can generate a playlist based on my top tracks.
- As a user, I can choose playlist rules (exclude top 5, include recommendations, length, etc.).
- As a user, I can save playlist to Spotify.

### 4.5 Group Mode (Party Playlist)
- As a host, I can create a group room and share a join link.
- As a participant, I can join the room by logging into Spotify and consenting.
- As a host, I can generate a combined playlist and export it to my Spotify.

## 5. Product Requirements (Features)

## 5.1 Feature: Authentication (Spotify OAuth)
**Requirement:** Implement Spotify OAuth 2.0 Authorization Code flow.

**Scopes (start minimal, add later):**
- Required for stats:
  - `user-top-read`
- Required for playlist creation (optional but recommended):
  - `playlist-modify-public`
  - `playlist-modify-private`

**Acceptance Criteria**
- User can log in and see their Spotify display name + profile image.
- Tokens are stored securely (server-side).
- User can log out (session cleared).
- Handle token refresh automatically.

## 5.2 Feature: Stats Dashboard
**Data shown (MVP)**
- Top Artists (limit 10/20)
- Top Tracks (limit 10/20)

**Time ranges**
- short_term (approx 4 weeks)
- medium_term (approx 6 months)
- long_term (several years)

**UI Requirements**
- Tabs for time ranges.
- Skeleton loading states.
- “Copy share link” CTA.
- “Create playlist from this” CTA.

**Acceptance Criteria**
- Switching time range does not re-fetch unnecessarily (cache).
- Errors are user-friendly (rate limit, auth expired).

## 5.3 Feature: Insights (Make it “unique” but still feasible)
Pick **2** insights for v1:
1. **Taste Drift Score**
   - Compare short_term vs long_term top artists.
   - Compute overlap % and display “Your taste changed X%”.
2. **Genre Cloud**
   - Aggregate genres from top artists and visualize top genres.
3. **Fresh Favorites**
   - Show top tracks excluding top N most-played (makes playlist feel new).

**Acceptance Criteria**
- Insight results are deterministic and match the underlying data.

## 5.4 Feature: Shareable Snapshot Links
**Concept:** A snapshot is a saved copy of a user’s stats at a moment in time.

**Behavior**
- User clicks “Generate share link”
- Backend saves:
  - user id (internal)
  - time range
  - top tracks/artists (IDs + names + images)
  - generated insight fields
  - createdAt
- Backend returns a public URL like:
  - `/share/:shareId`

**Privacy**
- Snapshot contains only what user has chosen to share (default: top 10 artists + top 10 tracks).
- Show a disclaimer: “This link is public to anyone with it.”

**Acceptance Criteria**
- Share page works without Spotify login.
- Share page is stable even if user later changes listening habits.
- User can delete a share snapshot.

## 5.5 Feature: Open Graph (OG) Share Image + Downloadable Card
**MVP Requirements**
- Each share page has an OG image at:
  - `/api/og/share/:shareId` (or similar)
- The share page sets OG tags to point to that image.
- Provide “Download image” button.

**Design Requirements**
- Clean layout, consistent colors, fallback for missing images.
- Supports light/dark theme for the card.

**Acceptance Criteria**
- Social preview renders when URL is pasted (Twitter/X, Discord, etc. vary).
- Image generation is fast (<2s typical).

## 5.6 Feature: Playlist Creation
**Modes**
- **Top Tracks Playlist**
  - Creates a playlist with the user’s top tracks for the chosen time range.
- **Top + Recommendations (Optional)**
  - Use seeds from top artists/tracks to fetch recommendations (if desired).

**User Controls**
- Playlist name (default: “Willow — Short Term”)
- Public/private toggle
- Exclude top N (default 0; option 5)
- Track count (20–50)

**Acceptance Criteria**
- Playlist is created successfully in user’s Spotify.
- Duplicates are avoided.
- Failure messages are clear (missing scope, etc.).

## 5.7 Feature: Group Mode (Party Playlist)
**MVP Flow**
1. Host creates room (no Spotify required yet).
2. Room page shows join link.
3. Joiners click join → Spotify login → app stores their top tracks (short_term) as contributions.
4. Host clicks “Generate playlist”:
   - Combine joiners’ top tracks
   - Deduplicate
   - Optional weighting (host 2x)
   - Create playlist in host’s Spotify

**Room Rules**
- Room expires automatically (e.g., 24 hours) unless host saves.
- Room has max participants (e.g., 10) to stay within rate limits.

**Acceptance Criteria**
- Room can be created and joined reliably.
- Playlist generation succeeds for a typical group (3–8 users).

---

## 6. Functional Requirements (Detailed)

## 6.1 API Integrations (Spotify Web API)
**Endpoints (common)**
- Get current user profile: `GET https://api.spotify.com/v1/me`
- Top artists: `GET /v1/me/top/artists?time_range=...&limit=...`
- Top tracks: `GET /v1/me/top/tracks?time_range=...&limit=...`

**Playlist**
- Create playlist: `POST /v1/users/{user_id}/playlists`
- Add items: `POST /v1/playlists/{playlist_id}/tracks`

**Notes**
- Respect rate limits (HTTP 429) with backoff.
- Cache results per user/time range.

## 6.2 Caching Strategy
**MVP**
- Cache top artists/tracks per user/time range for ~15 minutes.
- Store in MongoDB or in-memory + DB (Mongo recommended for persistence).

**Why**
- Faster UX, reduces rate limit issues.

## 6.3 Error Handling
- If Spotify returns 401: refresh token, retry once.
- If refresh fails: force re-login.
- If 429: show “Too many requests, try again in a minute.” and backoff on server.

## 6.4 Security Requirements
- Never expose `SPOTIFY_CLIENT_SECRET` to frontend.
- Store refresh tokens encrypted (or at minimum securely in DB with strict access).
- Use HTTP-only secure cookies for session tokens if possible.
- Validate all inputs (shareId, roomId).
- Rate limit public endpoints (share page / OG image) to avoid abuse.

## 6.5 Privacy Requirements
- Provide a “Delete my data” option:
  - deletes saved snapshots + tokens (or at minimum disconnect).
- Share pages must not show private info (email, etc.).
- Make it clear that share links are public.

---

## 7. Tech Stack (MERN-first)

## 7.1 Frontend
- React 18
- Vite (or CRA if you prefer)
- Tailwind CSS (recommended) or MUI
- React Router
- Axios/Fetch

## 7.2 Backend
- Node.js 20+
- Express
- Spotify Web API via Axios (or `spotify-web-api-node` library)
- Cookie-based sessions or JWT + refresh flow

## 7.3 Database
- MongoDB Atlas
- Mongoose schemas for:
  - Users (spotify id, tokens, profile info)
  - Snapshots (shareable stats)
  - Rooms + RoomMembers (group mode)
  - Cache documents (optional)

## 7.4 Deployment
- Frontend: Netlify
- Backend: Render / Railway / Fly.io
- MongoDB: Atlas
- Environment variables set in hosting dashboards.

---

## 8. Data Model (MongoDB)

## 8.1 User
**Collection:** `users`
- `_id` (ObjectId)
- `spotifyUserId` (string, unique)
- `displayName` (string)
- `profileImageUrl` (string)
- `accessToken` (string) *(short-lived, can store but prefer session)*
- `refreshToken` (string) *(store securely)*
- `tokenExpiresAt` (Date)
- `createdAt` (Date)
- `updatedAt` (Date)

## 8.2 Snapshot (Share Link)
**Collection:** `snapshots`
- `_id` (ObjectId)
- `shareId` (string, unique, short id)
- `spotifyUserId` (string)
- `timeRange` ("short_term" | "medium_term" | "long_term")
- `topArtists` (array)
  - `{ id, name, imageUrl, genres[] }`
- `topTracks` (array)
  - `{ id, name, artistNames[], albumImageUrl, previewUrl? }`
- `insights` (object)
  - `tasteDriftScore?` (number)
  - `topGenres?` (array of `{genre, count}`)
- `createdAt` (Date)
- `deletedAt` (Date|null)

## 8.3 Room
**Collection:** `rooms`
- `_id` (ObjectId)
- `roomId` (string, unique)
- `hostSpotifyUserId` (string)
- `name` (string) e.g. “Friday Night”
- `status` ("open" | "closed" | "expired")
- `expiresAt` (Date)
- `createdAt` (Date)

## 8.4 Room Member
**Collection:** `roomMembers`
- `_id` (ObjectId)
- `roomId` (string)
- `spotifyUserId` (string)
- `displayName` (string)
- `topTracks` (array of track ids + metadata snapshot)
- `joinedAt` (Date)

---

## 9. API Design (Express)

Base URL example: `https://api.yourdomain.com`

### 9.1 Auth
- `GET /auth/spotify/login`
  - redirects to Spotify authorize
- `GET /auth/spotify/callback`
  - exchanges code for tokens, stores user, sets session cookie, redirects to frontend
- `POST /auth/logout`
  - clears session

### 9.2 User + Stats
- `GET /api/me`
  - returns user profile (from DB)
- `GET /api/top?timeRange=short_term&limit=20`
  - returns top artists + top tracks (cached)

### 9.3 Snapshots
- `POST /api/snapshots`
  - body: `{ timeRange }`
  - creates snapshot and returns `{ shareUrl, shareId }`
- `GET /api/snapshots/:shareId`
  - returns snapshot public data (no auth required)
- `DELETE /api/snapshots/:shareId`
  - auth required; only owner can delete

### 9.4 OG Image (if generated from backend)
- `GET /api/og/share/:shareId`
  - returns PNG image

### 9.5 Playlists
- `POST /api/playlists/from-top`
  - body: `{ timeRange, excludeTopN, trackCount, name, isPublic }`
  - creates playlist and returns Spotify playlist URL

### 9.6 Rooms (Group Mode)
- `POST /api/rooms`
  - body: `{ name }`
  - returns `{ roomId, joinUrl }`
- `POST /api/rooms/:roomId/join`
  - stores joiner’s short_term top tracks snapshot
- `POST /api/rooms/:roomId/generate-playlist`
  - host-only; creates playlist using members’ tracks

---

## 10. Frontend Pages & UX

## 10.1 Routes
- `/` Landing page (CTA: “Login with Spotify”)
- `/dashboard`
  - time range tabs
  - lists for artists + tracks
  - buttons: Generate share link, Create playlist
- `/share/:shareId`
  - public view of snapshot
  - “Login to generate yours” CTA
- `/room/:roomId`
  - join room
  - list participants
  - host controls: generate playlist

## 10.2 UI Components
- `Navbar` (login state)
- `TimeRangeTabs`
- `TopArtistsGrid`
- `TopTracksList`
- `InsightCards`
- `ShareLinkModal`
- `ToastNotifications`
- `LoadingSkeletons`

---

## 11. Implementation Plan (Step-by-step)

## Phase 0 — Setup (0.5 day)
1. Create Spotify Developer App.
2. Add Redirect URIs:
   - `http://localhost:5000/auth/spotify/callback`
   - production callback
3. Create repos:
   - `client/` and `server/` (or monorepo)

## Phase 1 — Backend OAuth + Basic APIs (1–2 days)
1. Express server with env vars:
   - `SPOTIFY_CLIENT_ID`
   - `SPOTIFY_CLIENT_SECRET`
   - `SPOTIFY_REDIRECT_URI`
   - `MONGODB_URI`
   - `SESSION_SECRET`
2. Implement `/auth/spotify/login` and `/callback`.
3. Store user in MongoDB.
4. Implement token refresh helper.
5. Implement `/api/top` endpoint.

## Phase 2 — Frontend Dashboard (1–2 days)
1. Build landing + login button.
2. Build dashboard with tabs and lists.
3. Wire `/api/top` calls.
4. Add loading + error states.

## Phase 3 — Share Snapshots (1–2 days)
1. Create Snapshot schema.
2. Implement `POST /api/snapshots`.
3. Implement public `GET /api/snapshots/:shareId`.
4. Build `/share/:shareId` page.
5. Add “Delete snapshot” for owner.

## Phase 4 — Share Images (1–2 days)
Option A: generate image from backend using Canvas-like libs  
Option B: move share page + OG to Next.js (if you switch)

MVP approach:
1. Implement `/api/og/share/:shareId` returning PNG.
2. Add OG tags on share page (if SPA, you may need server rendering or a simple server-rendered share page).
   - **Important:** OG tags often require server-side HTML rendering. If using plain React SPA, consider:
     - rendering share page from backend (EJS/Handlebars) OR
     - switching frontend to Next.js for SSR on `/share/:shareId`.

## Phase 5 — Playlist Creation (1 day)
1. Add scopes for playlist modification.
2. Implement create playlist endpoint.
3. Add UI button with settings (name, length, public/private).

## Phase 6 — Group Mode (2–4 days)
1. Create room + join endpoints.
2. Implement join flow.
3. Combine tracks + dedupe.
4. Create playlist for host.
5. Add expiration and max participants.

---

## 12. Key Technical Decisions (Choose early)

### 12.1 SPA vs SSR for Share Pages
- If you want social previews (OG tags) to work reliably, you need **server-rendered HTML** for share pages.
**Recommendation:** Use **Next.js** for frontend (still “MERN-ish” with Node/React) OR serve share pages server-side from Express.

### 12.2 Token Storage
- MVP acceptable: store refresh token in DB and access token in memory/session.
- Better: encrypt refresh tokens at rest; store session in Redis.

### 12.3 Public Usage vs Friends-only
- Start friends-only to avoid complexity.
- Add monitoring + abuse prevention before going fully public.

---

## 13. Testing Plan

### Backend Tests
- OAuth callback handles invalid code.
- Token refresh works and updates expiry.
- `/api/top` returns correct shapes.
- Snapshot creation and retrieval.
- Playlist creation success + failure (missing scope).

### Frontend Tests (lightweight)
- Dashboard renders for each time range.
- Share link copy works.
- Error UI for expired login.

---

## 14. Analytics (Optional but good)
- Track:
  - logins
  - snapshot creations
  - share page views
  - playlist creations
- Tools: Plausible / PostHog / simple DB counters.

---

## 15. Risks & Mitigations
1. **OG tags on React SPA don’t work**  
   - Mitigation: Next.js SSR or server-render share pages.
2. **Rate limits**  
   - Mitigation: caching, limit defaults, backoff on 429.
3. **Token security**  
   - Mitigation: HTTP-only cookies, encrypt refresh token, least scopes.
4. **Abuse of public share links**  
   - Mitigation: random IDs, deletion, rate limits, optional expiry.

---

## 16. Definition of Done (MVP)
- User can log in with Spotify.
- User sees top artists/tracks for three time ranges.
- User can generate a share link and open it in incognito.
- User can create a playlist from top tracks.
- App deployed with working OAuth redirect.
- Basic error handling + caching included.

---

## 17. MVP Scope Recommendation (to ship fast)
If you want the fastest “real usable” version:
- Login + Dashboard + Snapshots + Playlist creation
- Skip group mode initially
- Do SSR share pages (Next.js recommended) if you want real social previews.

---

## 18. Environment Variables Checklist

### Server
- `SPOTIFY_CLIENT_ID`
- `SPOTIFY_CLIENT_SECRET`
- `SPOTIFY_REDIRECT_URI`
- `FRONTEND_URL`
- `MONGODB_URI`
- `SESSION_SECRET`
- `NODE_ENV`

### Client
- `VITE_API_BASE_URL` (or equivalent)

---

## 19. Milestones & Timeline (suggested)
- Day 1: OAuth + top endpoints working
- Day 2: Dashboard UI complete
- Day 3: Snapshots + share pages
- Day 4: Playlist creation + deploy
- Day 5+: OG images + Group Mode + polish

---

## 20. Next Steps (You choose)
1. Decide: React SPA + Express **or** Next.js + API routes (recommended for OG sharing).
2. Decide: include playlist creation in MVP? (I recommend yes.)
3. Confirm: friends-only first vs public.

If you tell me which path you want (SPA+Express vs Next.js), I can also generate:
- folder structure (`client/` + `server/`)
- exact route handlers (Express)
- Mongo schemas (