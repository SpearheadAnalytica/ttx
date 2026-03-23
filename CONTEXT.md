# TTX Platform — Project Context

## Status: Contracts Updated, Sprint 1 Ready

## What's Done

### Architecture (ARCHITECTURE.md)
- Full system design documented with expanded sections
- Tech stack: Next.js 14, Socket.io, Tiptap v2, Tailwind, shadcn/ui, PostgreSQL + Prisma, D3.js, Claude API
- Composite role model: base roles + staff flags (creator, co-planner, primary facilitator, co-facilitator)
- Full 22-capability permission matrix across all role/flag combinations
- Three participation modes: Digital, Facilitator-Led, Hybrid (per-room)
- Player join flow: room code, email invites, or both
- Player identity model: session-locked roles, facilitator-controlled transfers
- Message attribution to roles (not people) for AAR narrative
- Single-room / Plenary default, multi-room opt-in
- Master projection: CNN-style situation display with pop-out, room-specific URLs
- Mobile-first player view with bottom tab nav, tablet split view
- FedRAMP-ready patterns: 6-step API pattern, audit logging, encryption, RBAC
- Response collection: automatic capture, no extra player forms
- Cross-room communication with presets and configurable matrix
- AAR system: AI-drafted from all exercise data
- Exercise reconstruction: interactive visual replay
- Design system: light default, dark toggle, full color palettes, component standards
- Error handling: typed error codes with HTTP status mapping
- API design: REST for CRUD, Socket.io for real-time, cursor-based pagination

### Contracts (src/contracts/ — 18 files)
All TypeScript types defined as single source of truth:
- `user.ts` — User, Role, StaffFlags (isCreator, isCoPlanner, isPrimaryFacilitator, isCoFacilitator), derivePermissions() with 22 capabilities
- `exercise.ts` — Exercise with ParticipationMode (digital/facilitator_led/hybrid), PlayerJoinMethod (room_code/email_invite/both), JoinConfig, ExerciseStaffMember with composite flags
- `room.ts` — Room with per-room RoomParticipationMode, isPlenary flag
- `message.ts` — Polymorphic Message with senderRoleName for role-based attribution
- `inject.ts` — Phase and Inject with isPlenary flag for exercise-wide targeting
- `communication.ts` — CommunicationMatrix, CommunicationMode, mid-exercise changes
- `evaluator.ts` — EvaluatorNote, QuickTag system (11 tags), Rating, NoteSummary
- `socket-events.ts` — Full event maps including projection, lobby, and reconnection events
- `timeline.ts` — TimelineEvent with 18 event types (added ROLE_TRANSFERRED)
- `services.ts` — All service signatures: ExerciseService, RoomService, MessageService, InjectService, CommunicationService, EvaluatorService, TimelineService, StaffService (with transferOwnership, transferRole), AuthService, AuditService, ProjectionService, JoinService
- `stores.ts` — All Zustand stores: AuthStore, ExerciseStore (with flags), RoomStore, MessageStore, RfiStore, InjectStore, CommunicationStore, EvaluatorStore, TimelineStore, SocketStore (with reconnection), ProjectionStore, LobbyStore
- `errors.ts` — 35 typed error codes, HTTP status mapping
- `api.ts` — All REST request/response shapes, pagination, file upload flow
- `editor.ts` — EditorVariant configs (5 variants), feature flags
- `aar.ts` — AAR document model, AI agent input/output, generation progress
- `reconstruction.ts` — Visual replay data model, playback controls, analysis overlays
- `audit.ts` — AuditEntry, AuditAction (35+ actions), AuditTargetType, append-only log
- `projection.ts` — ProjectionState, ProjectionConfig, ProjectionInject

### Database Schema (prisma/schema.prisma)
- All tables: User, Exercise, ExerciseParticipant, Room, RoomPlayer, Message, Phase, Inject, EvaluatorNote, TimelineEvent, AuditLog
- All enums: ExerciseStatus, CommunicationPreset, ParticipantRole, ParticipationMode, PlayerJoinMethod, EmailInviteTiming, RoomParticipationMode, MessageType, RfiStatus, InjectType, InjectDeliveryMethod, InjectStatus, TimelineEventType
- ExerciseParticipant has composite flag columns: isCreator, isCoPlanner, isPrimaryFacilitator, isCoFacilitator, roleName
- Message has senderRoleName for role-based attribution
- Room has isPlenary and participationMode
- Inject has isPlenary for exercise-wide targeting
- AuditLog: immutable append-only, indexed on exerciseId+timestamp and actorId+timestamp
- Indexes on all query-hot paths, cascade deletes on exercise children

### Infrastructure
- Playwright configured (headless Chromium)
- TypeScript strict mode
- Git repo initialized

## What's Next — Sprint 1

**Goal**: Rich text editor + single room with live chat. Editor-first because text UX is the #1 adoption factor.

Build order:
1. Next.js scaffolding + Tailwind light/dark theme
2. Tiptap rich text editor (5 variants: chat, note, inject, rfi, response)
3. Room chat UI (message list + composer)
4. Socket.io real-time messaging
5. PostgreSQL schema + Prisma
6. Tests (Playwright E2E + Vitest unit)

See SPRINT.md for full function signatures and scope.

## Key Design Decisions

| Decision | Why |
|---|---|
| Composite flags (not hierarchical roles) | One person can be Creator + Primary Facilitator. Flexible assignment without role explosion |
| Messages belong to roles, not people | AAR narrative is role-based. Audit log tracks both for accountability |
| Three participation modes | Digital, Facilitator-Led, Hybrid (per-room) covers all real-world scenarios |
| Observer = pure spectator | Evaluators take notes; observers just watch. Clean separation |
| Light theme default | Professional setting, dark toggle available. Projection defaults dark for dim rooms |
| FedRAMP patterns from day one | Audit logging, 6-step API, encryption — habits built early, not bolted on |
| Room code + email invite join | Quick join for small exercises, pre-planned for large. Both for real-world flexibility |
| Editor-first build order | Text experience is make-or-break for adoption |
| Tiptap v2 (not Slate, not Quill) | Headless, extensible, ProseMirror core, collaboration-ready |
| Tiptap JSON storage (not HTML) | Structured, queryable, renders consistently |
| Branded ID types (e.g., RoomId) | Prevents accidental ID mixing at compile time |
| Role permissions derived, not stored | Single source of truth in derivePermissions() function |
| Communication matrix as adjacency map | Flexible, supports all presets, easy mid-exercise changes |
| Default Plenary room | Every exercise starts simple. Multi-room is opt-in |
| AI-drafted AAR (not manual) | The report is the deliverable — AI makes it effortless |
| Typed error codes (not error classes) | Serializable over the wire, exhaustive matching |
| Cursor-based pagination | Stable under concurrent inserts |
| Presigned URL uploads | Keeps large files off the app server |
| Append-only audit log | FedRAMP-ready, no deletes ever |

## Lessons Learned

- Capture design conversations into contracts immediately — a long gap between discussion and documentation creates drift and lost decisions

## File Map
```
ARCHITECTURE.md          — Full system design (expanded with 8+ new sections)
SPRINT.md                — Sprint 1 plan with function signatures
CONTEXT.md               — This file
CLAUDE.md                — Project principles and workflow
src/contracts/           — TypeScript type contracts (18 files)
prisma/schema.prisma     — Database schema (with AuditLog + new enums)
tests/                   — Test directory (placeholder only)
```
