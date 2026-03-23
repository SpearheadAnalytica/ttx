# TTX Platform — Project Context

## Status: All Contracts Complete, Sprint 1 Ready

Last session: 2026-03-23
Branch: `claude/review-context-docs-XvYhr`
Commits: 3 (648dcea, 8185743, 9b58aac)

## What's Done

### Architecture (ARCHITECTURE.md — 30+ sections)
- Full system design covering all aspects of the TTX platform
- Tech stack: Next.js 14, Socket.io, Tiptap v2, Tailwind, shadcn/ui, PostgreSQL + Prisma, D3.js, Claude API, Jitsi (self-hosted), Keycloak
- Composite role model with 4 base roles + 4 staff flags, 22-capability permission matrix
- 6-state exercise lifecycle: DRAFT → CONFIGURING → READY → LIVE → PAUSED → COMPLETED
- Three participation modes (Digital, Facilitator-Led, Hybrid), two join methods (room code, email invite)
- Multi-room membership with information asymmetry as a first-class mechanic
- Video conferencing via self-hosted Jitsi with facilitator comms control
- Enterprise auth: PIV/CAC, SAML/OIDC via Keycloak identity broker
- Player-to-player DMs with facilitator controls
- 11-step setup wizard with dry run and bulk CSV import
- Configurable export wizard (11 data categories, CSV/Excel)
- White-card form contract for live inject creation
- Master projection, mobile-first player view, FedRAMP patterns
- Full design system with light/dark color palettes

### Contracts (src/contracts/ — 21 files)
All TypeScript types defined as single source of truth:
- `user.ts` — User, Role, StaffFlags, AuthProvider, AuthConfig, SessionConfig, derivePermissions()
- `exercise.ts` — Exercise, ExerciseStatus (6 states), VALID_TRANSITIONS, SetupWizardStep, DryRunState, BulkPlayerImport/InjectImport, ExerciseDMConfig
- `room.ts` — Room, RoomPlayer (multi-room), VisibilityRules (info asymmetry), RoomVideoConfig
- `message.ts` — Polymorphic Message with senderRoleName
- `inject.ts` — Phase, Inject, InjectTypeTag (9 tags), WhiteCardForm, WhiteCardInject
- `communication.ts` — CommunicationMatrix, mid-exercise changes
- `evaluator.ts` — EvaluatorNote, QuickTag, Rating
- `video.ts` — JitsiConfig, VideoParticipant, VideoMeetingState, JitsiCommand
- `dm.ts` — DirectMessage, DMThread, DMPermissions
- `export.ts` — ExportCategory (11), ExportConfig, ExportResult
- `socket-events.ts` — All events: projection, lobby, video, DM, reconnection
- `timeline.ts` — TimelineEvent with 18 event types
- `services.ts` — 16 service types: Exercise, Room, Message, Inject, Communication, Evaluator, Timeline, Staff, Auth, Audit, Projection, Join, Video, DM, Export, Setup
- `stores.ts` — 15 Zustand stores: Auth, Exercise, Room, Message, Rfi, Inject, Communication, Evaluator, Timeline, Socket, Projection, Lobby, Video, DM, Export
- `errors.ts` — 35 typed error codes
- `api.ts` — REST request/response shapes
- `editor.ts` — 5 editor variants
- `aar.ts` — AAR document model, AI agent
- `reconstruction.ts` — Visual replay
- `audit.ts` — Append-only audit log
- `projection.ts` — Master projection state

### Database Schema (prisma/schema.prisma — 12 models, 13 enums)
- Models: User, Exercise, ExerciseParticipant, Room, RoomPlayer, Message, DirectMessage, Phase, Inject, EvaluatorNote, TimelineEvent, AuditLog
- ExerciseStatus: 6 values (DRAFT/CONFIGURING/READY/LIVE/PAUSED/COMPLETED)
- RoomPlayer: multi-room membership (unique on roomId+userId+exerciseId)
- Room: isPlenary, participationMode, isVideoEnabled, visibilityRules
- DirectMessage model for player-to-player DMs
- AuditLog: immutable append-only

### Quality Gates Passed
- Review: No `any` types, no silent failures, no unnecessary complexity
- Debug loop: All imports valid, state machine complete, permissions correct
- Security: 0 npm vulnerabilities, no hardcoded secrets, no OWASP patterns
- Circular import between exercise.ts ↔ dm.ts resolved

## What's Next — Sprint 1

**Goal**: Rich text editor + single room with live chat

Build order:
1. Next.js scaffolding + Tailwind light/dark theme
2. Tiptap rich text editor (5 variants: chat, note, inject, rfi, response)
3. Room chat UI (message list + composer)
4. Socket.io real-time messaging
5. PostgreSQL schema + Prisma migrations
6. Tests (Playwright E2E + Vitest unit)

See SPRINT.md for full function signatures and scope.

## Key Design Decisions

| Decision | Why |
|---|---|
| Composite flags (not hierarchical roles) | Flexible assignment without role explosion |
| Messages belong to roles, not people | AAR narrative is role-based |
| 6-state lifecycle (not 4) | CONFIGURING and READY prevent premature Go Live |
| Multi-room membership | Players as natural coordination points |
| Information asymmetry first-class | Per-room visibility rules |
| Jitsi self-hosted | Compliance-friendly, destroy meeting = cut comms |
| Keycloak identity broker | PIV/CAC, SAML, OIDC, email in one broker |
| Player-to-player DMs | Mirrors real incident response |
| 11-step setup wizard | Guided setup prevents misconfiguration |
| Dry run before Go Live | Validates inject timing without players |
| Configurable export (11 categories) | Covers all post-exercise reporting needs |
| White-card form with type tags | Rich live inject creation |
| Append-only audit log | FedRAMP-ready, no deletes ever |

## Lessons Learned

- Capture design conversations into contracts immediately — gaps create drift
- Contract files are cheap; missing contracts are expensive
- Circular imports emerge when domain boundaries aren't clean — inline types to break cycles
- Review + debug loop catches real issues (missing enum values, import cycles) that visual review misses

## File Map
```
ARCHITECTURE.md          — Full system design (30+ sections)
SPRINT.md                — Sprint 1 plan with function signatures
CONTEXT.md               — This file
CLAUDE.md                — Project principles and workflow
src/contracts/           — TypeScript type contracts (21 files)
prisma/schema.prisma     — Database schema (12 models, 13 enums)
tests/                   — Test directory (placeholder only)
```
