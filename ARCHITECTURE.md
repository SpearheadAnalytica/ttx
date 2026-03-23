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

- **Aesthetic**: Dark, tactical — command-center feel with monospace accents
- **Theme**: Dark-first with high-contrast elements for readability during long exercises
- **Color palette**: Slate/zinc backgrounds, emerald accents for success, amber for warnings, red for critical injects
- **Typography**: Inter for body, JetBrains Mono for timestamps/codes/IDs
- **Rich text**: Full formatting — bold, italic, headers, lists, code blocks, tables, file attachments, @mentions
- **Editor experience**: Tiptap with slash commands, toolbar, markdown shortcuts. Must feel as good as Notion.
- **Layout**: Dense but not cramped. Generous padding in text areas. Chat messages get full width.

## Roles & Permissions

```
FACILITATOR (White Cell)
├── Can: create/edit exercises, manage rooms, send injects, respond to RFIs,
│        control timing, change communication rules mid-exercise, view all rooms
├── Sees: everything — all rooms, all messages, all evaluator notes
└── Identity: exercise creator + invited co-facilitators

EVALUATOR (Note-taker / Grader)
├── Can: take timestamped notes, tag decisions with quick-tags, rate responses,
│        view assigned room(s) feed, export their notes
├── Cannot: send messages, respond to RFIs, interact with players
├── Sees: assigned room(s) or all rooms (configurable)
└── Identity: individually assigned by facilitator (notes are attributed)

OBSERVER (VIP / Read-only)
├── Can: watch live dashboard, drill into any room feed
├── Cannot: interact with anything — pure spectator
├── Sees: all rooms (dashboard view), timeline, room activity levels
└── Identity: shareable link (optional password) or email invite

PLAYER
├── Can: chat in their room, upload files, send RFIs to White Cell,
│        respond to injects, contact other rooms (if allowed)
├── Cannot: see other rooms (unless cross-room messaging is enabled for them)
├── Sees: their room only
└── Identity: room code or email invite
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
