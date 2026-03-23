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
/exercises/[id]/aar         → After Action Report
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
│   └── shared/                 # Cross-cutting components (timeline, etc.)
├── contracts/                  # TypeScript types — single source of truth
│   ├── exercise.ts
│   ├── room.ts
│   ├── message.ts
│   ├── inject.ts
│   ├── user.ts
│   ├── evaluator.ts
│   ├── communication.ts
│   └── socket-events.ts
├── lib/
│   ├── socket.ts               # Socket.io client setup
│   ├── prisma.ts               # Prisma client singleton
│   └── auth.ts                 # NextAuth config
├── server/
│   ├── socket-handler.ts       # Socket.io server event handlers
│   ├── services/               # Business logic
│   │   ├── exercise-service.ts
│   │   ├── message-service.ts
│   │   ├── inject-service.ts
│   │   ├── rfi-service.ts
│   │   └── communication-service.ts
│   └── api/                    # REST API route handlers
├── stores/                     # Zustand stores
│   ├── exercise-store.ts
│   ├── room-store.ts
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
