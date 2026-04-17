# Willow Backend-First Master Checklist

Project tagline: Every Era Has a Sound

Use this as your primary execution tracker. The order is intentionally backend-first so frontend can integrate against stable APIs.

## How to use this checklist

- Mark tasks complete only when code is merged and manually verified.
- For each completed API endpoint, add at least one automated test.
- Do not move to public launch tasks until security and abuse checks are complete.

## 0) Architecture and scope lock (must finish first)

- [ ] Confirm v1 MVP includes: Auth, Top Stats, Snapshots, Playlist creation.
- [ ] Confirm Group Mode is post-MVP or in MVP.
- [ ] Confirm hosting targets: backend (Render/Railway/Fly), DB (Mongo Atlas), frontend (Vercel/Netlify).
- [ ] Confirm API base URL strategy for local/staging/prod.
- [ ] Decide SSR approach for share pages and OG tags:
- [ ] Option A: Express server-rendered share HTML route.
- [ ] Option B: Next.js share page SSR.
- [ ] Define final backend folder structure and naming conventions.
- [ ] Define coding conventions (ESLint/Prettier, import ordering, env naming).

## 1) Repo and environment setup

### 1.1 Server bootstrap
- [ ] Initialize Node 20+ server package if not done.
- [ ] Add scripts: dev, start, test, lint.
- [ ] Install core dependencies:
- [ ] express
- [ ] axios
- [ ] mongoose
- [ ] cookie-parser
- [ ] express-session (or preferred session layer)
- [ ] connect-mongo (if session persistence in Mongo)
- [ ] helmet
- [ ] cors
- [ ] express-rate-limit
- [ ] zod or joi (input validation)
- [ ] dotenv
- [ ] pino or winston (logging)
- [ ] nanoid/uuid (IDs)
- [ ] Add dev dependencies:
- [ ] nodemon
- [ ] vitest or jest
- [ ] supertest
- [ ] eslint + prettier

### 1.2 Environment variables and config
- [ ] Create server .env with:
- [ ] SPOTIFY_CLIENT_ID
- [ ] SPOTIFY_CLIENT_SECRET
- [ ] SPOTIFY_REDIRECT_URI
- [ ] FRONTEND_URL
- [ ] MONGODB_URI
- [ ] SESSION_SECRET
- [ ] NODE_ENV
- [ ] Optional: ENCRYPTION_KEY (for refresh token encryption)
- [ ] Optional: REDIS_URL (if future session/cache upgrade)
- [ ] Add server .env.example with placeholder values.
- [ ] Implement centralized config loader with runtime validation.
- [ ] Fail fast on startup when required env vars are missing.

### 1.3 Security baseline middleware
- [ ] Enable helmet with safe defaults.
- [ ] Configure CORS allowlist for local and production frontend origins.
- [ ] Enable JSON body size limits.
- [ ] Add request ID middleware for traceability.
- [ ] Add global error handler with safe error responses.
- [ ] Disable x-powered-by header.

## 2) Data model implementation (MongoDB)

### 2.1 Users collection
- [ ] Create User schema with indexes:
- [ ] spotifyUserId unique index
- [ ] updatedAt index (optional)
- [ ] Fields implemented:
- [ ] spotifyUserId
- [ ] displayName
- [ ] profileImageUrl
- [ ] accessToken (if stored)
- [ ] refreshToken (encrypted if possible)
- [ ] tokenExpiresAt
- [ ] createdAt/updatedAt timestamps

### 2.2 Snapshots collection
- [ ] Create Snapshot schema with indexes:
- [ ] shareId unique index
- [ ] spotifyUserId index
- [ ] createdAt index
- [ ] deletedAt index (for soft delete filtering)
- [ ] Fields implemented:
- [ ] shareId
- [ ] spotifyUserId
- [ ] timeRange enum: short_term, medium_term, long_term
- [ ] topArtists array item shape validation
- [ ] topTracks array item shape validation
- [ ] insights object
- [ ] createdAt
- [ ] deletedAt nullable

### 2.3 Rooms and RoomMembers collections (if Group Mode in scope)
- [ ] Create Room schema with indexes:
- [ ] roomId unique index
- [ ] hostSpotifyUserId index
- [ ] expiresAt index
- [ ] status index
- [ ] Create RoomMember schema with indexes:
- [ ] compound index on roomId + spotifyUserId (prevent duplicate joins)
- [ ] roomId index
- [ ] spotifyUserId index

### 2.4 Cache strategy implementation
- [ ] Decide cache persistence:
- [ ] Option A: dedicated cache collection in Mongo
- [ ] Option B: in-memory LRU + fallback DB
- [ ] Implement key format: top:{spotifyUserId}:{timeRange}:{limit}
- [ ] Implement cache TTL around 15 minutes.
- [ ] Add cache bypass flag for debugging (admin-only or dev-only).

## 3) Spotify integration layer

### 3.1 Spotify client module
- [ ] Create reusable Spotify API client wrapper.
- [ ] Set Authorization Bearer token per user context.
- [ ] Implement typed helper methods:
- [ ] getCurrentUserProfile
- [ ] getTopArtists(timeRange, limit)
- [ ] getTopTracks(timeRange, limit)
- [ ] createPlaylist(userId, payload)
- [ ] addTracksToPlaylist(playlistId, uris)
- [ ] optional getRecommendations(seeds)

### 3.2 Token lifecycle handling
- [ ] Build token refresh function using refresh token flow.
- [ ] On 401 from Spotify:
- [ ] refresh token
- [ ] persist new access token + expiry
- [ ] retry original request once only
- [ ] If refresh fails:
- [ ] clear session
- [ ] return auth-expired response contract

### 3.3 Rate limit and resilience
- [ ] Handle Spotify 429 responses.
- [ ] Read Retry-After header where present.
- [ ] Apply exponential backoff for internal retries (bounded).
- [ ] Return user-safe error: too many requests.
- [ ] Add circuit-breaker style protection for repeated Spotify failures (optional but recommended).

## 4) Authentication and session APIs

### 4.1 OAuth endpoints
- [ ] Implement GET /auth/spotify/login:
- [ ] include required scopes: user-top-read
- [ ] include optional playlist scopes behind feature flag or default on
- [ ] include state and PKCE if chosen
- [ ] Implement GET /auth/spotify/callback:
- [ ] validate state
- [ ] exchange code for token set
- [ ] fetch profile from /v1/me
- [ ] create/update user record
- [ ] establish session cookie
- [ ] redirect to frontend dashboard

### 4.2 Session management
- [ ] Use HTTP-only cookies.
- [ ] Set secure=true in production.
- [ ] Set sameSite policy per deployment topology.
- [ ] Add session expiry policy and rolling behavior.
- [ ] Add POST /auth/logout to destroy session and clear cookie.

### 4.3 Auth guards
- [ ] Build middleware: requireAuth.
- [ ] Build middleware: requireSnapshotOwner.
- [ ] Build middleware: requireRoomHost.

## 5) Core API endpoints (MVP)

### 5.1 GET /api/me
- [ ] Return normalized user profile contract.
- [ ] Exclude sensitive token fields from response.
- [ ] Add test: unauthenticated returns 401.
- [ ] Add test: authenticated returns profile shape.

### 5.2 GET /api/top
- [ ] Validate query params:
- [ ] timeRange in enum
- [ ] limit numeric and bounded (10/20 or configured)
- [ ] Serve cached result when fresh.
- [ ] Fetch from Spotify when cache miss.
- [ ] Return response shape with artists and tracks arrays.
- [ ] Add tests:
- [ ] cache hit path
- [ ] cache miss path
- [ ] invalid query path
- [ ] token refresh path

### 5.3 POST /api/snapshots
- [ ] Validate body: timeRange and optional limits.
- [ ] Reuse top stats source data from cache/API.
- [ ] Compute selected insights and include deterministic outputs.
- [ ] Generate unique shareId.
- [ ] Persist snapshot payload with createdAt.
- [ ] Return shareUrl and shareId.
- [ ] Add tests: creates snapshot, invalid input rejected.

### 5.4 GET /api/snapshots/:shareId (public)
- [ ] Validate shareId format.
- [ ] Return 404 for missing or deleted snapshots.
- [ ] Return public-safe snapshot payload only.
- [ ] Add test: no auth required.
- [ ] Add test: deleted snapshot returns 404.

### 5.5 DELETE /api/snapshots/:shareId
- [ ] Validate ownership via spotifyUserId.
- [ ] Soft delete by setting deletedAt.
- [ ] Return idempotent success response.
- [ ] Add tests: non-owner forbidden, owner success.

### 5.6 POST /api/playlists/from-top
- [ ] Validate body:
- [ ] timeRange enum
- [ ] excludeTopN bounded
- [ ] trackCount between 20 and 50
- [ ] name length limit
- [ ] isPublic boolean
- [ ] Build candidate tracks from top tracks data.
- [ ] Apply excludeTopN rule.
- [ ] Deduplicate track URIs.
- [ ] Cap to trackCount.
- [ ] Create playlist in Spotify user account.
- [ ] Add tracks in batches respecting API limits.
- [ ] Return playlist URL and playlist ID.
- [ ] Add tests: success, missing scopes, invalid payload.

## 6) Insights engine (backend)

### 6.1 Taste Drift Score
- [ ] Pull short_term and long_term top artists.
- [ ] Compute overlap set size and percentage.
- [ ] Define formula and rounding rules.
- [ ] Add deterministic unit tests with fixtures.

### 6.2 Genre aggregation
- [ ] Aggregate genres from top artists.
- [ ] Normalize casing and trim whitespace.
- [ ] Count and sort descending.
- [ ] Return top N genres.
- [ ] Add deterministic unit tests.

### 6.3 Insight contract versioning
- [ ] Add insightVersion field in snapshot for forward compatibility.
- [ ] Keep old snapshots renderable after insight changes.

## 7) OG image and share rendering backend

### 7.1 OG image endpoint
- [ ] Implement GET /api/og/share/:shareId.
- [ ] Validate shareId and load snapshot.
- [ ] Render PNG with fallback when image URLs fail.
- [ ] Add caching headers for CDN friendliness.
- [ ] Target average generation latency under 2 seconds.

### 7.2 Share metadata support
- [ ] Expose share page metadata contract for title/description/image URL.
- [ ] Ensure OG image URL is absolute in production.
- [ ] Verify crawler accessibility (no auth required).

## 8) Group Mode backend (if enabled)

### 8.1 Room lifecycle endpoints
- [ ] Implement POST /api/rooms (host creates room).
- [ ] Implement POST /api/rooms/:roomId/join (participant contributes tracks).
- [ ] Implement POST /api/rooms/:roomId/generate-playlist (host only).
- [ ] Implement room expiration checks on read/write.
- [ ] Enforce max participants (for example 10).

### 8.2 Playlist generation for group
- [ ] Merge member top tracks.
- [ ] Deduplicate globally.
- [ ] Optional host weighting (2x) behind flag.
- [ ] Track deterministic ordering policy.
- [ ] Create final playlist in host account.

### 8.3 Group tests
- [ ] Test room create/join success.
- [ ] Test duplicate join blocked.
- [ ] Test expired room behavior.
- [ ] Test non-host cannot generate playlist.

## 9) Validation, contracts, and API docs

- [ ] Implement request validation schemas for every endpoint.
- [ ] Implement standardized error envelope.
- [ ] Implement standardized success envelope where useful.
- [ ] Document endpoint contracts in OpenAPI or Markdown.
- [ ] Add examples for each endpoint and status code.

## 10) Security and abuse prevention

### 10.1 Data and token security
- [ ] Encrypt refresh tokens at rest.
- [ ] Rotate encryption key policy defined.
- [ ] Mask tokens in logs.
- [ ] Restrict DB permissions to least privilege.

### 10.2 API hardening
- [ ] Rate limit auth and public endpoints.
- [ ] Add stricter rate limit for OG and share endpoints.
- [ ] Validate all IDs and enforce max lengths.
- [ ] Add anti-open-redirect checks in auth flow.
- [ ] Add CSRF strategy if needed for cookie-based writes.

### 10.3 Privacy requirements
- [ ] Ensure public snapshots exclude email/private profile data.
- [ ] Add delete-my-data endpoint or flow.
- [ ] Confirm snapshot disclaimer appears in API/UX flow.

## 11) Observability and operations

- [ ] Add structured logging with request IDs.
- [ ] Add error-level alerts to provider dashboard.
- [ ] Add endpoint latency logging.
- [ ] Add Spotify dependency failure metrics.
- [ ] Add counters: logins, snapshots created, share hits, playlists created.

## 12) Automated tests and quality gates

### 12.1 Unit tests
- [ ] Insight math functions.
- [ ] dedupe and track-selection helpers.
- [ ] token refresh helper.
- [ ] validation schema edge cases.

### 12.2 Integration tests
- [ ] auth callback success/failure.
- [ ] /api/top full path.
- [ ] snapshots create/get/delete.
- [ ] playlist creation endpoint.
- [ ] room flow endpoints (if enabled).

### 12.3 Contract and regression checks
- [ ] Freeze response fixtures for critical endpoints.
- [ ] Add CI step for lint + tests.
- [ ] Add minimum coverage threshold.

## 13) Deployment readiness checklist

### 13.1 Pre-deploy
- [ ] Set production env vars in backend hosting dashboard.
- [ ] Configure production MongoDB URI and IP/network rules.
- [ ] Configure Spotify production callback URI.
- [ ] Verify cookie settings for production domain.

### 13.2 Post-deploy smoke tests
- [ ] Login flow works end to end.
- [ ] /api/me works for authenticated user.
- [ ] /api/top works for all 3 time ranges.
- [ ] Snapshot create and public read work.
- [ ] Playlist create works with expected defaults.
- [ ] 401 refresh path works.
- [ ] 429 handling is user-safe.

### 13.3 Launch guardrails
- [ ] Confirm rate limits are active.
- [ ] Confirm logs do not leak secrets.
- [ ] Confirm delete-my-data flow is functional.
- [ ] Confirm rollback plan exists.

## 14) Frontend integration phase (after backend stable)

- [ ] Publish API integration notes for frontend.
- [ ] Provide ready-to-use endpoint examples and error cases.
- [ ] Build mobile-first frontend against stable contracts.
- [ ] Validate UX for loading/error/empty states using real API responses.

## 15) Definition of done (backend-first MVP)

- [ ] OAuth login/logout, session, and token refresh are production-safe.
- [ ] /api/top is cached, validated, and resilient.
- [ ] Snapshots are creatable, publicly viewable, and deletable by owner.
- [ ] Playlist creation works with dedupe and control options.
- [ ] Security baseline (rate limits, validation, token safety) is in place.
- [ ] Tests cover critical paths and pass in CI.
- [ ] Backend is deployed and verified in production.
