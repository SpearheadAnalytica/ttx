# TTX Platform — Architecture

## Overview

A real-time, web-based Tabletop Exercise (TTX) platform for cybersecurity incident response training. Facilitators design scenarios with timed injects, players respond in isolated rooms, evaluators take structured notes, and observers watch live — all producing a rich After Action Report.

## Core Design Decisions

| Decision | Choice | Rationale |
|---|---|---|
| Framework | Next.js 14 (App Router) | React ecosystem, SSR, API routes, Vercel deployment |
| Real-time | Socket.io | Reliable WebSocket with fallback, rooms built-in |
| Rich text editor | Tiptap v2 | Headless, extensible, collaborative-ready, ProseMirror core |
| Styling | Tailwind CSS | Utility-first, dark theme via `class` strategy |
| UI components | shadcn/ui | Copy-paste components, full control, dark-first |
| Database | PostgreSQL + Prisma | Typed ORM, migrations, relation-heavy data model |
| Auth | NextAuth.js | Session-based, supports email + magic link |
| State | Zustand | Lightweight, no boilerplate, good with real-time |
| Testing | Playwright (E2E) + Vitest (unit) | Per CLAUDE.md — Playwright for UI, Vitest for logic |
| File uploads | S3-compatible (local: MinIO) | Evidence attachments, inject assets |
| AAR AI agent | Claude API | Structured output, long context for full exercise data |
| Visualization | D3.js | Flow diagrams, interactive timeline, analysis overlays |
| Error handling | Typed error codes + factories | Consistent wire format, fail-loudly enforcement |

## UI Design

- **Aesthetic**: Professional crisis management — serious, trustworthy, government-ready
- **Theme**: Light default for all views. Dark option toggle. Projection defaults to dark (better on projectors in dim rooms)
- **Rich text**: Full formatting — bold, italic, headers, lists, code blocks, tables, file attachments, @mentions
- **Editor experience**: Tiptap with slash commands, toolbar, markdown shortcuts. Must feel as good as Notion
- **Layout**: Dense but not cramped. Generous padding in text areas. Chat messages get full width

### Light Theme Palette (Default)

```
Background:     #FFFFFF               Surface:        #F8FAFC  (light gray)
Surface raised: #FFFFFF  (white)      Border:         #E2E8F0  (soft gray)
Text primary:   #1A202C  (near-black) Text secondary: #64748B  (slate)
Text disabled:  #CBD5E1  (light slate)
```

### Dark Theme Palette (Toggle + Projection Default)

```
Background:     #0F1419  (near-black) Surface:        #1A2332  (dark navy)
Surface raised: #243044  (elevated)   Border:         #2D3F56  (subtle)
Text primary:   #E8ECF1  (off-white)  Text secondary: #8899AA  (muted)
Text disabled:  #4A5568  (ghosted)
```

### Status Colors (Same Across Themes)

```
Active/Live:    #16A34A  (green)      Warning:        #D97706  (amber)
Critical:       #DC2626  (red)        Info/Inject:    #2563EB  (blue)
White Card:     #9333EA  (purple)     Primary action: #2563EB  (blue)
```

### Typography

- **Headings & body**: Inter — clean, professional, excellent at small sizes
- **Monospace** (timestamps, codes, IDs): JetBrains Mono

### Component Style

- Cards with subtle borders, not drop shadows (cleaner, gov-appropriate)
- Rounded corners: 6px — not boxy, not bubbly
- Dense information layout — professional tool, not consumer app
- Status indicators: colored dots + text labels (never color alone — accessibility)
- Animations: minimal, 150ms transitions for state changes, no bounces or slides

## Roles & Permissions

Participants have a **base role** (facilitator, evaluator, observer, player) plus **composite staff flags** that layer additional permissions. One person can hold multiple flags.

### Staff Flags

**Design-phase flags** (pre-live exercise configuration):
- **Creator**: Creates the exercise, assigns all roles, transfers ownership, deletes. Exactly one per exercise.
- **Co-Planner**: Helps design (rooms, injects, config) but cannot assign roles or transfer ownership.

**Live-phase flags** (during active exercise):
- **Primary Facilitator**: Runs the live exercise — Go Live, Pause/Resume, Advance Phase, Broadcast to all rooms, End. One per exercise.
- **Co-Facilitator**: Assists during live — deliver injects, white-card, cut/restore comms, chat in rooms. Cannot control exercise lifecycle.

Common combinations: Creator + Primary Facilitator (solo facilitator), Co-Planner + Co-Facilitator (design helper who also assists live).

### Permission Matrix

| Capability | Creator | Co-Planner | Primary Facil | Co-Facil | Evaluator | Player | Observer |
|---|---|---|---|---|---|---|---|
| Create exercise | Yes | — | — | — | — | — | — |
| Edit exercise config (pre-live) | Yes | Yes | Yes | No | No | No | No |
| Add/remove rooms | Yes | Yes | No | No | No | No | No |
| Add/remove players | Yes | Yes | Yes | No | No | No | No |
| Create/edit injects | Yes | Yes | Yes | No | No | No | No |
| Assign facilitators | Yes | No | No | No | No | No | No |
| Assign co-planners | Yes | No | No | No | No | No | No |
| Go Live / End | — | — | Yes | No | No | No | No |
| Pause / Resume | — | — | Yes | No | No | No | No |
| Advance phase | — | — | Yes | No | No | No | No |
| Deliver injects | — | — | Yes | Yes | No | No | No |
| White-card injects | — | — | Yes | Yes | No | No | No |
| Cut/restore comms | — | — | Yes | Yes | No | No | No |
| Broadcast (all rooms) | — | — | Yes | No | No | No | No |
| View all rooms | — | — | Yes | Yes | Config | No | Yes |
| View own room | — | — | — | — | Config | Yes | — |
| Chat in room | — | — | Yes | Yes | No | Yes | No |
| Add notes | — | — | Yes | Yes | Yes | No | No |
| Rate responses | — | — | No | No | Yes | No | No |
| Export data | Yes | Yes | Yes | Yes | Yes | No | No |
| View audit log | Yes | Yes | Yes | Yes | No | No | No |
| View master projection | All | All | All | All | All | All | All |

### Role Details

```
FACILITATOR (White Cell) — base role for all facilitator-flagged users
├── Creator flag
│   └── Can: create exercise, assign all roles, transfer ownership, delete exercise
├── Co-Planner flag
│   └── Can: edit exercise config, manage rooms, create injects (design-phase)
├── Primary Facilitator flag
│   └── Can: Go Live, Pause/Resume, Advance Phase, Broadcast, End exercise
├── Co-Facilitator flag
│   └── Can: deliver injects, white-card, cut/restore comms, chat in rooms
└── Common: view all rooms, add notes, export data, view audit log

EVALUATOR (Note-taker / Grader)
├── Can: take timestamped notes, quick-tag decisions, rate responses
├── Cannot: send messages, respond to RFIs, interact with players
├── Sees: assigned room(s) — split-pane: live feed + note panel
├── Quick tags: Good Decision, Gap Identified, Escalation, Meeting Called,
│              Delay, Creative Solution, Missed Step, Good Coordination
└── Identity: individually assigned by facilitator (notes are attributed)

OBSERVER (VIP / Read-only)
├── Can: watch live dashboard, drill into any room feed (read-only)
├── Cannot: interact with anything — pure spectator, no notes
├── Sees: all rooms (dashboard: activity levels + timeline)
└── Identity: shareable link (optional password) or email invite

PLAYER
├── Can: chat in their room, upload files, send RFIs to White Cell,
│        respond to injects, contact other rooms (if allowed)
├── Cannot: see other rooms (unless cross-room messaging is enabled)
├── Sees: their room only
└── Identity: room code or email invite, session-locked to one role
```

## Cross-Room Communication

Communication between rooms is a core exercise mechanic, not just a feature.

### Presets

| Preset | Behavior |
|---|---|
| **Open** | All rooms can message any room directly |
| **Hierarchical** | Messages flow along a defined chain (e.g., SOC → Exec → Board) |
| **Controlled** | All cross-room communication routes through White Cell |
| **Custom** | Facilitator defines a per-room matrix |

### Communication Matrix

Stored as an adjacency map: `{ [fromRoomId]: { [toRoomId]: 'direct' | 'routed' | 'blocked' } }`

- **direct**: players can message the target room freely
- **routed**: message goes to White Cell as an RFI; facilitator relays manually
- **blocked**: no communication path exists (room not even shown)

### Mid-Exercise Changes

Facilitator can modify the matrix during the exercise. Changes can optionally trigger an inject to affected rooms explaining the change narratively (e.g., "Network to executive floor is down").

## Single-Room / Plenary Mode

Every exercise starts with one default room called "Plenary." Multi-room is opt-in.

- When a facilitator creates an exercise, a "Plenary" room is auto-created. All players go in it.
- The setup wizard skips room configuration unless the planner clicks "Add Rooms."
- In single-room mode, the facilitator dashboard collapses to a simpler layout — no room grid, just one feed.
- The data model is the same (minimum 1 room always). The UI adapts based on room count.
- Injects can target a specific room or be "plenary" (exercise-wide, all rooms).

## Master Projection

The master projection is a CNN-style situation display shown on a projector or external screen.

- **Route**: `/exercises/[id]/project` (plenary) or `/exercises/[id]/project/room/[name]` (room-specific)
- **Default theme**: Dark background, high-contrast (good for dim rooms with projectors). Toggle to light available.
- **Shows**: exercise clock, current phase, plenary injects, exercise status
- **Does NOT show**: room-specific injects, facilitator controls, chat, evaluator notes, admin UI
- **Pop-out**: Facilitator clicks "Open Projection Window" → `window.open()` inherits session, renders projection view only
- **Room-specific projections**: Separate URLs per room, each opened on that room's display machine
- **Facilitator-Led Mode**: Projection becomes primary delivery channel. Shows ALL injects (not just plenary). Facilitator clicks "Show on Projection" to push injects.

## Player Participation Modes

Three participation modes, set at exercise level (or per-room in hybrid mode):

| Feature | Digital | Facilitator-Led | Hybrid |
|---|---|---|---|
| Player invite links | Yes | No | Per room |
| Player login portal | Active | Disabled | Per room |
| Player chat | Active | Disabled | Per room |
| Player response submission | Digital form | Facilitator logs manually | Mixed |
| Inject delivery | Push to device | Projection/verbal | Mixed |
| Master projection shows | Plenary context | ALL injects (primary channel) | Plenary |

In hybrid mode, each room independently gets its participation mode. Example: SOC team is remote (digital), executives are in a conference room (facilitator-led).

## Player Join Flow

Two join methods (or both):

**Room Code (Quick Join)**: Facilitator shares code verbally or on projection. Players enter code + name → land in lobby. Facilitator assigns them to rooms/roles from the lobby.

**Email Invites (Pre-Planned)**: Upload CSV or add manually. Each gets a magic link → one click, no password, lands in assigned role. Can schedule send timing: now, at exercise start, or manual trigger.

**Both**: Email invites for known participants + room code for walk-ins.

## Player Identity & Session Model

- One user = one role per exercise (enforced)
- One role = one active session at a time (session lock)
- If someone else tries the same role: "This role is currently active in another session"
- Facilitator can transfer a role to another user mid-exercise
- On transfer: old player loses access immediately, messages stay attributed to the role name
- **Messages belong to roles, not people**: AAR shows "SOC Analyst said X" regardless of which human was behind the role. Audit log tracks both.

## Mobile-First Player View

Player view targets 320px–768px widths as primary:

- **Phone**: Bottom tab bar (Feed, Chat, Role, Injects) — always visible, no hamburger menu
- **Tablet (768px–1024px)**: Split view — feed left, chat right
- **Offline/poor connectivity**: Cache last state, show "Reconnecting..." banner, queue outbound messages, WebSocket with auto-reconnect + polling fallback

## FedRAMP-Ready Patterns

Built-in from day one, even during development:

Every API endpoint follows the 6-step pattern:
1. Authenticate (who are you?)
2. Authorize (can you do this action on this resource?)
3. Validate input (is the data shaped correctly?)
4. Execute (do the thing)
5. Audit log (record what happened)
6. Return (scoped to what the caller is allowed to see)

| Requirement | Implementation |
|---|---|
| Encryption at rest | AES-256 for stored exercise content |
| Encryption in transit | HTTPS everywhere, TLS for all API calls |
| Auth & sessions | Proper session tokens with rotation, expiry, secure flags |
| Audit logging | Immutable append-only log: timestamp, actor, action, target, result. No deletes ever |
| Input validation | Strict schema validation on every API endpoint. Parameterized queries only |
| RBAC | Permission model enforced server-side, not just UI-hidden |
| Secret management | Environment variables, .env in .gitignore, no hardcoded secrets |
| Dependency scanning | npm audit in CI, pinned dependency versions |
| Data residency | US-only data storage, self-hosted assets (no Google Fonts, no foreign CDN) |
| Session timeout | Auto-logout after inactivity, configurable per-org, default 30 minutes |
| FIPS 140-2 crypto | Node built-in crypto with FIPS-compliant algorithms |

## Response Collection

Automatic capture — players don't fill out forms:

| Data | How Captured |
|---|---|
| Chat messages | Logged automatically with timestamps, sender role, room |
| RFIs sent to White Cell | Logged when sent |
| Cross-room messages | Logged when sent |
| Documents uploaded | Logged when dropped into room |
| Inject read receipts | Logged when player opens inject |
| Inject response times | Time from delivery to first substantive action |
| Timeline | Composite of all above |

Facilitator/evaluator observation notes provide the qualitative data. Formal deliverables (press statements, incident reports) are the one place players actively submit — part of the exercise, not admin overhead.

## Data Model (High-Level)

```
Exercise
├── id, title, description, status (draft|active|paused|completed)
├── createdBy (User)
├── communicationPreset, communicationMatrix
├── phases[]
│   ├── id, name, description, order, durationMinutes
│   └── injects[]
│       ├── id, title, content (rich text), type (narrative|question|data|communication_change)
│       ├── targetRoomId, delayFromPhaseStart, deliveryMethod (auto|manual)
│       └── attachments[]
├── rooms[]
│   ├── id, name, description, color
│   └── players[] (User references)
├── staff
│   ├── facilitators[] (User references)
│   ├── evaluators[] ({ userId, assignedRoomIds[] })
│   └── observerConfig { accessType: 'link'|'password'|'email_list', password?, emails?[] }
└── timeline[] (auto-generated from all events)

Message
├── id, exerciseId, roomId, senderId
├── content (rich text — Tiptap JSON), attachments[]
├── type (chat|rfi_request|rfi_response|inject|system|cross_room)
├── metadata { rfiId?, injectId?, sourceRoomId?, targetRoomId? }
└── createdAt

EvaluatorNote
├── id, exerciseId, evaluatorId, roomId
├── content (rich text), tags[] (e.g., 'good_decision', 'gap', 'delay')
├── rating? (1-5), linkedMessageId?
└── createdAt

Event (for timeline)
├── id, exerciseId, type (inject_delivered|rfi_sent|rfi_answered|phase_changed|
│                          comm_rule_changed|room_message|decision_tagged)
├── roomId?, actorId?, metadata {}
└── createdAt
```

## Page Structure

```
/                           → Landing / login
/exercises                  → Exercise list (facilitator dashboard)
/exercises/new              → Create exercise wizard
/exercises/[id]/setup       → Exercise setup (rooms, staff, injects, comm rules)
/exercises/[id]/facilitate  → Facilitator live view (White Cell)
/exercises/[id]/evaluate    → Evaluator live view (split: feed + notes)
/exercises/[id]/observe     → Observer dashboard (read-only)
/exercises/[id]/room/[roomId] → Player room view
/exercises/[id]/aar         → After Action Report (view + edit)
/exercises/[id]/reconstruct → Exercise reconstruction visual
/join/[code]                → Player join via room code
/watch/[token]              → Observer join via shareable link
/exercises/[id]/project           → Master projection (plenary)
/exercises/[id]/project/room/[roomId] → Room-specific projection
```

## Real-Time Architecture

```
Client (Next.js)  ←→  Socket.io Server  ←→  PostgreSQL
                          │
                          ├── Room: exercise:{id}:room:{roomId}
                          ├── Room: exercise:{id}:facilitator
                          ├── Room: exercise:{id}:evaluator:{userId}
                          ├── Room: exercise:{id}:observer
                          └── Room: exercise:{id}:timeline
```

### Socket Events

| Event | Direction | Description |
|---|---|---|
| `message:send` | client → server | Player/facilitator sends a message |
| `message:new` | server → client | New message broadcast to room |
| `inject:deliver` | server → client | Inject arrives in a room |
| `rfi:submit` | client → server | Player submits RFI to White Cell |
| `rfi:respond` | client → server | Facilitator responds to RFI |
| `rfi:update` | server → client | RFI status change broadcast |
| `phase:change` | server → client | Exercise phase transition |
| `comm:update` | server → client | Communication rules changed |
| `timeline:event` | server → client | New event for timeline feed |
| `typing:start` | client → server | Typing indicator |
| `typing:stop` | client → server | Typing indicator cleared |

## Rich Text Editor Spec

The editor is the most critical UX element. It must feel premium.

### Tiptap Extensions

- **StarterKit**: bold, italic, strike, headings, bullet/ordered lists, blockquote, code, horizontal rule
- **Placeholder**: contextual placeholder text ("Type a message...", "Add your observation...")
- **Link**: auto-detect URLs, click to open
- **CodeBlock (lowlight)**: syntax-highlighted code blocks
- **Table**: for structured data in injects and notes
- **TaskList**: checkboxes in evaluator notes
- **FileAttachment**: custom extension — drag-drop or click to attach files
- **Mention**: @mention players, rooms, or injects by name
- **SlashCommand**: type `/` for quick formatting menu (like Notion)
- **CharacterCount**: subtle character count for RFIs
- **Typography**: smart quotes, em-dashes auto-replacement

### Editor Variants

| Context | Toolbar | Features | Height |
|---|---|---|---|
| Room chat | Floating on select | Bold, italic, code, link, attach, mention | Auto-grow, min 44px |
| Facilitator inject | Fixed top bar | Full formatting + tables + file attach | Fixed 300px, resizable |
| Evaluator notes | Fixed top bar | Full formatting + task lists + tags | Auto-grow, min 120px |
| RFI compose | Floating on select | Bold, italic, code, link | Auto-grow, min 44px, max 200px |
| White Cell response | Fixed top bar | Full formatting + file attach | Auto-grow, min 80px |

### Keyboard Shortcuts

- `Cmd+Enter` — send message / submit note
- `Cmd+B/I/K` — bold, italic, link
- `Cmd+Shift+M` — toggle code block
- `Tab` / `Shift+Tab` — indent/outdent lists
- `/` at start of line — slash command menu

## Directory Structure

```
src/
├── app/                        # Next.js App Router pages
│   ├── layout.tsx
│   ├── page.tsx
│   ├── exercises/
│   ├── join/
│   └── watch/
├── components/
│   ├── ui/                     # shadcn/ui primitives
│   ├── editor/                 # Tiptap editor variants
│   │   ├── rich-editor.tsx     # Base editor component
│   │   ├── chat-editor.tsx     # Chat message variant
│   │   ├── note-editor.tsx     # Evaluator note variant
│   │   └── inject-editor.tsx   # Facilitator inject variant
│   ├── room/                   # Player room components
│   ├── facilitate/             # Facilitator view components
│   ├── evaluate/               # Evaluator view components
│   ├── observe/                # Observer dashboard components
│   ├── aar/                    # AAR viewer and editor components
│   ├── reconstruction/         # Visual replay + analysis components
│   └── shared/                 # Cross-cutting components (timeline, etc.)
├── contracts/                  # TypeScript types — single source of truth
│   ├── user.ts
│   ├── exercise.ts
│   ├── room.ts
│   ├── message.ts
│   ├── inject.ts
│   ├── communication.ts
│   ├── evaluator.ts
│   ├── socket-events.ts
│   ├── timeline.ts
│   ├── services.ts             # All service function signatures
│   ├── stores.ts               # All Zustand store state + actions
│   ├── errors.ts               # Typed error codes + factories
│   ├── api.ts                  # REST request/response shapes
│   ├── editor.ts               # Tiptap editor variant configs
│   ├── aar.ts                  # After Action Report + AI agent
│   ├── reconstruction.ts       # Visual replay + analysis tools
│   └── index.ts                # Barrel export
├── lib/
│   ├── socket.ts               # Socket.io client setup
│   ├── prisma.ts               # Prisma client singleton
│   └── auth.ts                 # NextAuth config
├── server/
│   ├── socket-handler.ts       # Socket.io server event handlers
│   ├── services/               # Business logic
│   │   ├── exercise-service.ts
│   │   ├── room-service.ts
│   │   ├── message-service.ts
│   │   ├── inject-service.ts
│   │   ├── communication-service.ts
│   │   ├── evaluator-service.ts
│   │   ├── timeline-service.ts
│   │   ├── staff-service.ts
│   │   ├── auth-service.ts
│   │   └── aar-service.ts
│   ├── ai/                     # AI agent for AAR generation
│   │   └── aar-agent.ts
│   ├── errors.ts               # Error factory implementations
│   └── api/                    # REST API route handlers
├── stores/                     # Zustand stores
│   ├── auth-store.ts
│   ├── exercise-store.ts
│   ├── room-store.ts
│   ├── message-store.ts
│   ├── rfi-store.ts
│   ├── inject-store.ts
│   ├── communication-store.ts
│   ├── evaluator-store.ts
│   ├── timeline-store.ts
│   └── socket-store.ts
├── styles/
│   └── globals.css             # Tailwind base + custom properties
└── utils/
    ├── format-time.ts
    └── generate-codes.ts

tests/
├── contracts/                  # Contract validation tests
├── unit/                       # Vitest unit tests
├── e2e/                        # Playwright E2E tests
│   ├── room-chat.spec.ts
│   ├── inject-delivery.spec.ts
│   ├── evaluator-notes.spec.ts
│   ├── cross-room.spec.ts
│   └── observer-view.spec.ts
└── fixtures/                   # Test data factories

prisma/
├── schema.prisma
└── migrations/
```

## After Action Report (AAR)

The AAR is the capstone deliverable — an AI-drafted analysis document produced from all exercise data.

### Generation Flow

```
Exercise completes
  → Facilitator clicks "Generate AAR"
  → System bundles all data (timeline, messages, notes, metrics)
  → AI agent (Claude API) processes the bundle
  → Structured output: executive summary, sections, findings, recommendations
  → Draft appears in rich text editor for facilitator review
  → Facilitator edits, reviews each section, publishes
  → Export to PDF, HTML, Markdown, or JSON
```

### AAR Sections

| Section | AI Input | Purpose |
|---|---|---|
| Executive Summary | Full exercise data | 1-page overview for leadership |
| Exercise Overview | Metadata, participants | Context and objectives |
| Timeline Narrative | All timeline events | Chronological story of what happened |
| Phase Analysis | Per-phase data | Breakdown of each phase's events |
| Communication Analysis | Message patterns, matrix changes | Cross-room communication effectiveness |
| Decision Analysis | Evaluator-tagged decisions | Key decisions and their outcomes |
| Gap Analysis | Evaluator notes with gap/missed tags | Identified weaknesses |
| Strengths | Evaluator notes with positive tags | What went well |
| Recommendations | Findings + AI analysis | Prioritized action items |
| Appendix | Raw data | Supporting evidence |

### AI Agent Design

- **Input**: Single structured payload with all exercise data (plain text extracted from rich text for token efficiency)
- **Output**: Structured JSON with markdown content per section (converted to Tiptap JSON for editing)
- **Streaming**: Progress events via SSE so UI shows generation status per section
- **Findings**: AI synthesizes evaluator notes + its own analysis into ranked findings with severity levels
- **Recommendations**: Each recommendation links back to supporting findings

## Exercise Reconstruction

Interactive visual replay and analysis tool. Built with D3.js for the flow diagram, React for controls and detail panels.

### What It Shows

- **Flow diagram**: Rooms as nodes, communication as edges. Edges appear/disappear as communication rules change. Edge thickness = message volume.
- **Timeline ruler**: Phase boundaries, inject markers, key moments. Scrub to any point.
- **Playback**: Play/pause/seek like a video. Speed: 1x, 2x, 5x, 10x, 30x.
- **Drill-down**: Click any event, room, or edge → detail panel with messages, notes, metrics from that moment.

### Analysis Overlays

Toggle-able layers on top of the base diagram:

| Overlay | What it shows |
|---|---|
| Response Time Heatmap | Rooms colored by avg inject response time (green=fast, red=slow) |
| Communication Volume | Edge thickness = message count between rooms |
| RFI Flow | All RFI paths with status color coding |
| Decision Points | Evaluator-tagged decision moments highlighted |
| Bottleneck Detection | AI-identified bottlenecks (slow responses, queued RFIs) |
| Activity Heatmap | Room brightness = message rate over time |

### Annotations

Facilitators pin annotations to specific moments in the reconstruction for the AAR. Annotations are callout bubbles with category (insight/issue/highlight/question) and can be exported as screenshots.

## Error Handling

Follows the "fail loudly" principle. Typed error codes, never swallowed.

### Pattern

```typescript
// Factory functions create consistent errors
throw notFound('Exercise', exerciseId);
throw permissionDenied('send message', 'facilitator');
throw invalidTransition('Exercise', 'DRAFT', 'COMPLETED');

// Global error handler catches, logs with [module] prefix, returns ApiResponse
// { ok: false, error: { code: 'EXERCISE_NOT_FOUND', message: '...' } }
```

### Error Categories

| Category | HTTP Status | Examples |
|---|---|---|
| Auth | 401/403 | AUTH_REQUIRED, AUTH_FORBIDDEN |
| Not Found | 404 | EXERCISE_NOT_FOUND, ROOM_NOT_FOUND |
| Validation | 400 | INVALID_INPUT, INVALID_RICH_TEXT, FILE_TOO_LARGE |
| State Conflict | 409 | INVALID_STATUS_TRANSITION, RFI_ALREADY_ANSWERED |
| Permission | 403 | NOT_FACILITATOR, COMMUNICATION_BLOCKED |
| Rate Limit | 429 | RATE_LIMITED, AAR_GENERATION_IN_PROGRESS |
| Server | 500 | DATABASE_ERROR, AI_SERVICE_ERROR |

## API Design

REST for CRUD and data fetching. Socket.io for real-time events. All REST responses wrapped in `ApiResponse<T>`:

```typescript
type ApiResponse<T> = { ok: true; data: T } | { ok: false; error: { code, message } };
```

### Pagination

Cursor-based (not offset-based) for stability under concurrent inserts. Cursor is the `createdAt` ISO string of the last item. Max 100 items per page.

### File Uploads

Two-step presigned URL flow:
1. `POST /api/uploads/presign` → get presigned S3 URL + file ID
2. Client uploads directly to S3 (bypasses app server)
3. `POST /api/uploads/confirm` → confirm upload, get permanent URL

Size limit: 10MB. Allowed types: images, PDFs, text files, CSVs.

## Security

- All Socket.io connections authenticated via session token
- Room isolation enforced server-side — clients can only join authorized rooms
- Observer tokens are time-limited and revocable
- RFI responses validated against facilitator role
- File uploads scanned and size-limited (10MB default)
- No PII stored beyond email addresses
- Exercise data can be exported and deleted (GDPR-friendly)

## Performance Targets

- Message delivery: < 100ms end-to-end (same region)
- Editor input latency: < 16ms (60fps)
- Time to interactive: < 2s on first load
- Concurrent users per exercise: 50+ without degradation
- Message history: lazy-loaded, 50 messages per page
