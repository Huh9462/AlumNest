# Alumnest — PRD (living document)

## Original problem statement
Alumnest connects Lighthouse Group (and other schools') alumni with their juniors to solve 12th-grader admission anxiety and 9th–10th career-path confusion. Verified alumni set daily "working hours" during which juniors can DM/call them; trusted connections can reach them anytime. An AI (AluPal) matches juniors' target college + stream to relevant alumni. A global leaderboard + printable scorecard drives mentor engagement (ASSOCHAM stress data, Frontiers 2026 study on engagement, ResearchGate on Indian admissions).

## User personas
- **Junior** (grade 9–12): stressed about admissions/streams, wants real advice from real seniors.
- **Alumni** (undergrad+): willing to mentor, wants recognition (points + resume certificate).
- **Admin**: moderates verification and abuse reports (Phase 2).

## Architecture
- **Backend**: FastAPI + MongoDB (Motor). JWT bearer auth. Emergent Universal LLM Key powering Claude Sonnet 4.6 for AluPal.
- **Frontend**: React 19 + React Router 7 + Tailwind + Shadcn primitives, neo-brutalist pastel design (Outfit/Manrope fonts, hard borders + pastel fills).
- **Auth**: Bearer JWT, 7-day expiry. Email/password + student ID card upload (base64 in MongoDB for MVP; Phase 2 → object storage + manual review).

## Phase 1 — Shipped (2026-02-09) — the "aha moment"
1. **Signup with ID card upload + JWT login** — role selector (junior/alumni), verified flag, working hours setter for alumni.
2. **Alumni directory with working-hours indicator** — search + filter by college/stream, live "Available now" vs "Opens in Xh Ym" pill.
3. **AluPal AI matcher** — junior enters target college + stream + worry → LLM returns encouraging reasoning + per-alumni "why this fits". Local score fallback if LLM unavailable.
4. **Global leaderboard + printable scorecard** — top-3 podium bgs, /certificate/me returns rank/percentile/certificate-id; browser-print → PDF.

Supporting: 8 seeded demo alumni across IIT/AIIMS/SRCC/NLSIU/NID/IIM/BITS, "They helped me" quick log (+10 pts to mentor), sticky glass nav, landing page with bento hero + college marquee + how-it-works.

## Phase 2 — In progress (2026-02-17)
- **Real-time chat (polling every 3.5s)** — `POST /api/chat/send`, `GET /api/chat/conversations`, `GET /api/chat/messages/{id}`
- **Working-hours enforcement** — junior→alumni sends are blocked outside the alumni's window with a clear "Opens in Xh Ym" error (HTTP 423)
- **Trusted connections** — alumni can add a junior as trusted from the chat header; trusted juniors can DM 24/7 (`POST/DELETE /api/chat/trusted/{junior_id}`)
- **Leaderboard upgrades** — filters: All-time vs This week (uses help_logs), by school; self-callout with "You are #X" and rank badge on your own row; live-polling nav badge for unread messages

## Phase 2 — Backlog (prioritised)
### P0 (safety + core flow)
- Real-time DM (locked to working hours except for trusted connections)
- Trusted-connections list management
- Report abuse / ghosting mid-chat
- Manual ID verification queue (admin dashboard)
- Object storage for ID cards (currently base64 in Mongo)

### P1 (community + retention)
- Public Q&A forums with upvotes
- "Publish this DM advice anonymously" workflow (+ upvote bonus points)
- Mentor-side proof submission for help-count (currently junior-triggered)
- Voice/video call scheduling within working hours
- Email/push notification when a mentor is about to open their window

### P2 (growth + integrations)
- Cialfo integration (SSO + college data feed)
- Social-networking layer (posts, follows, feed)
- School-admin dashboards (aggregate mental-health signals)
- Referral / invite-a-senior flow with points

## Known limitations
- AluPal falls back to local ranking when Emergent LLM Key budget is $0. User must top up at Profile → Universal Key → Add Balance to enable AI-personalised reasoning.
- ID verification is auto-approved in Phase 1 for MVP demos; real verification queue in Phase 2.
- Working hours are treated as UTC in MVP; TZ-aware windows in Phase 2.

## Test credentials
See `/app/memory/test_credentials.md`.
