# TTX Platform — Project Context

## Status: Architecture Complete, Sprint 1 Ready

## What's Done

### Architecture (ARCHITECTURE.md)
- Full system design documented
- Tech stack decided: Next.js 14, Socket.io, Tiptap v2, Tailwind, shadcn/ui, PostgreSQL + Prisma
- UI aesthetic: dark tactical, command-center feel
- Four roles defined: Facilitator, Evaluator, Observer, Player
- Cross-room communication system designed with presets (open/hierarchical/controlled/custom)
- Communication matrix model: adjacency map with direct/routed/blocked modes
- Page structure, directory layout, security model, performance targets documented

### Contracts (src/contracts/)
All TypeScript types defined as single source of truth:
- `user.ts` — User, Role, ExerciseParticipant, RolePermissions with full permission map
- `exercise.ts` — Exercise, ExerciseStaff, ObserverConfig, create/update inputs
- `room.ts` — Room with join codes, create/update inputs
- `message.ts` — Polymorphic Message (chat/rfi/inject/system/cross_room), RichTextContent as Tiptap JSON, Attachment, RFI lifecycle types
- `inject.ts` — Phase and Inject with timing, delivery methods, status tracking
- `communication.ts` — CommunicationMatrix, CommunicationMode, mid-exercise change types
- `evaluator.ts` — EvaluatorNote, QuickTag system (11 tags with labels/icons), Rating, NoteSummary
- `socket-events.ts` — Full ClientToServerEvents and ServerToClientEvents type maps
- `timeline.ts` — TimelineEvent with 16 event types for AAR backbone

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

## Lessons Learned
- None yet (first sprint not started)

## File Map
```
ARCHITECTURE.md          — Full system design
SPRINT.md                — Sprint 1 plan with function signatures
CONTEXT.md               — This file
CLAUDE.md                — Project principles and workflow
src/contracts/           — TypeScript type contracts (9 files)
tests/                   — Test directory (placeholder only)
```
