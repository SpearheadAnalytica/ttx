# TTX Platform — Project Context

## Status: Contracts Complete, Sprint 1 Ready

## What's Done

### Architecture (ARCHITECTURE.md)
- Full system design documented
- Tech stack: Next.js 14, Socket.io, Tiptap v2, Tailwind, shadcn/ui, PostgreSQL + Prisma, D3.js, Claude API
- UI aesthetic: dark tactical, command-center feel
- Four roles: Facilitator, Evaluator, Observer, Player
- Cross-room communication system with presets (open/hierarchical/controlled/custom)
- Communication matrix model: adjacency map with direct/routed/blocked modes
- AAR system: AI agent generates structured draft from all exercise data
- Exercise reconstruction: interactive visual replay with analysis overlays
- Error handling: typed error codes with HTTP status mapping
- API design: REST for CRUD, Socket.io for real-time, cursor-based pagination
- File uploads: two-step presigned URL flow
- Page structure, directory layout, security model, performance targets

### Contracts (src/contracts/ — 16 files)
All TypeScript types defined as single source of truth:
- `user.ts` — User, Role, ExerciseParticipant, RolePermissions with full permission map
- `exercise.ts` — Exercise, ExerciseStaff, ObserverConfig, create/update inputs
- `room.ts` — Room with join codes, create/update inputs
- `message.ts` — Polymorphic Message (chat/rfi/inject/system/cross_room), RichTextContent as Tiptap JSON, Attachment, RFI lifecycle
- `inject.ts` — Phase and Inject with timing, delivery methods, status tracking
- `communication.ts` — CommunicationMatrix, CommunicationMode, mid-exercise change types
- `evaluator.ts` — EvaluatorNote, QuickTag system (11 tags), Rating, NoteSummary
- `socket-events.ts` — Full ClientToServerEvents and ServerToClientEvents type maps
- `timeline.ts` — TimelineEvent with 17 event types
- `services.ts` — All service function signatures (8 services, ~60 functions)
- `stores.ts` — All Zustand store state + actions (9 stores)
- `errors.ts` — 35 typed error codes, HTTP status mapping, factory function signatures
- `api.ts` — All REST request/response shapes, pagination, file upload flow
- `editor.ts` — EditorVariant configs (5 variants), feature flags, RichEditorProps
- `aar.ts` — AAR document model, AI agent input/output, generation progress, export formats
- `reconstruction.ts` — Visual replay data model, playback controls, analysis overlays, drill-down, annotations

### Database Schema (prisma/schema.prisma)
- All tables: User, Exercise, ExerciseParticipant, Room, RoomPlayer, Message, Phase, Inject, EvaluatorNote, TimelineEvent
- All enums: ExerciseStatus, CommunicationPreset, ParticipantRole, MessageType, RfiStatus, InjectType, InjectDeliveryMethod, InjectStatus, TimelineEventType
- Indexes on all query-hot paths
- Cascade deletes on exercise children

### Infrastructure
- Playwright configured (headless Chromium)
- TypeScript strict mode
- Git repo with branch `claude/ttx-tool-setup-U6ihf`

## What's Next — Sprint 1

**Goal**: Rich text editor + single room with live chat. Editor-first because text UX is the #1 adoption factor.

Build order:
1. Next.js scaffolding + Tailwind dark theme
2. Tiptap rich text editor (5 variants: chat, note, inject, rfi, response)
3. Room chat UI (message list + composer)
4. Socket.io real-time messaging
5. PostgreSQL schema + Prisma
6. Tests (Playwright E2E + Vitest unit)

See SPRINT.md for full function signatures and scope.

## Key Design Decisions

| Decision | Why |
|---|---|
| Editor-first build order | Text experience is make-or-break for adoption |
| Tiptap v2 (not Slate, not Quill) | Headless, extensible, ProseMirror core, collaboration-ready |
| Tiptap JSON storage (not HTML) | Structured, queryable, renders consistently |
| Branded ID types (e.g., `RoomId`) | Prevents accidental ID mixing at compile time |
| Role permissions derived, not stored | Single source of truth in ROLE_PERMISSIONS constant |
| Communication matrix as adjacency map | Flexible, supports all presets, easy mid-exercise changes |
| White Cell responses are manual | Keeps facilitator in full control, AI-assist can come later |
| Observer link with optional auth | Low friction for VIPs, optional password for security |
| AI-drafted AAR (not manual) | The report is the deliverable — AI makes it effortless |
| Reconstruction as analysis tool | Not just a pretty timeline — overlays, drill-down, annotations |
| Typed error codes (not error classes) | Serializable over the wire, exhaustive matching, consistent format |
| Cursor-based pagination | Stable under concurrent inserts, no offset drift |
| Presigned URL uploads | Keeps large files off the app server |

## Lessons Learned
- None yet (first sprint not started)

## File Map
```
ARCHITECTURE.md          — Full system design
SPRINT.md                — Sprint 1 plan with function signatures
CONTEXT.md               — This file
CLAUDE.md                — Project principles and workflow
src/contracts/           — TypeScript type contracts (16 files)
prisma/schema.prisma     — Database schema
tests/                   — Test directory (placeholder only)
```
