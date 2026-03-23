# TTX Platform — Project Context

## Status: Contracts Complete, Sprint 1 Ready

## What's Done

### Architecture (ARCHITECTURE.md)
- Full system design with 25+ sections covering all aspects
- Tech stack: Next.js 14, Socket.io, Tiptap v2, Tailwind, shadcn/ui, PostgreSQL + Prisma, D3.js, Claude API, Jitsi (self-hosted)
- Composite role model: base roles + staff flags (creator, co-planner, primary facilitator, co-facilitator)
- Full 22-capability permission matrix across all role/flag combinations
- Three participation modes: Digital, Facilitator-Led, Hybrid (per-room)
- Player join flow: room code, email invites, or both
- Player identity model: session-locked roles, facilitator-controlled transfers, role-based message attribution
- Single-room / Plenary default, multi-room opt-in with multi-room membership
- Master projection: CNN-style situation display with pop-out, room-specific URLs
- Mobile-first player view with bottom tab nav, tablet split view
- FedRAMP-ready patterns: 6-step API pattern, audit logging, encryption, RBAC
- Response collection: automatic capture, no extra player forms
- Cross-room communication with presets and configurable matrix
- Video conferencing via self-hosted Jitsi with facilitator comms control
- Enterprise authentication: PIV/CAC, SAML/OIDC via Keycloak
- Player-to-player DMs with facilitator controls
- Export wizard with configurable categories and formats (CSV/Excel)
- Information asymmetry as a first-class exercise mechanic
- 11-step setup wizard with dry run and bulk CSV import
- Design system: light default, dark toggle, full color palettes, component standards
- AAR system: AI-drafted from all exercise data
- Exercise reconstruction: interactive visual replay

### Contracts (src/contracts/ — 21 files)
All TypeScript types defined as single source of truth:
- `user.ts` — User, Role, StaffFlags, AuthProvider (email/SAML/OIDC/PIV-CAC), AuthConfig, SessionConfig, derivePermissions() with 22 capabilities
- `exercise.ts` — Exercise with ParticipationMode, PlayerJoinMethod, expanded ExerciseStatus (6 states: draft/configuring/ready/live/paused/completed), VALID_TRANSITIONS, SetupWizardStep (11 steps), DryRunState, BulkPlayerImport, BulkInjectImport
- `room.ts` — Room with RoomParticipationMode, isPlenary, RoomPlayer (multi-room membership with isPrimaryRoom), VisibilityRules (information asymmetry)
- `message.ts` — Polymorphic Message with senderRoleName for role-based attribution
- `inject.ts` — Phase, Inject, InjectTypeTag (9 tags), WhiteCardForm, WhiteCardInject
- `communication.ts` — CommunicationMatrix, CommunicationMode, mid-exercise changes
- `evaluator.ts` — EvaluatorNote, QuickTag system (11 tags), Rating, NoteSummary
- `video.ts` — JitsiConfig, VideoParticipant, VideoMeetingState, JitsiCommand, JitsiIFrameEvent
- `dm.ts` — DirectMessage, DMThread, DMPermissions, SendDMInput
- `export.ts` — ExportCategory (11 categories), ExportConfig, ExportFormat, ExportResult
- `socket-events.ts` — Full event maps including projection, lobby, video, DM, and reconnection events
- `timeline.ts` — TimelineEvent with 18 event types
- `services.ts` — All service signatures: ExerciseService, RoomService (with multi-room + visibility), MessageService, InjectService (with whiteCardInject), CommunicationService, EvaluatorService, TimelineService, StaffService, AuthService (with SSO/PIV-CAC), AuditService, ProjectionService, JoinService, VideoService, DMService, ExportService, SetupService
- `stores.ts` — All Zustand stores: AuthStore, ExerciseStore, RoomStore (with joinedRoomIds), MessageStore, RfiStore, InjectStore, CommunicationStore, EvaluatorStore, TimelineStore, SocketStore, ProjectionStore, LobbyStore, VideoStore, DMStore, ExportStore
- `errors.ts` — 35 typed error codes, HTTP status mapping
- `api.ts` — All REST request/response shapes, pagination, file upload flow
- `editor.ts` — EditorVariant configs (5 variants), feature flags
- `aar.ts` — AAR document model, AI agent input/output, generation progress
- `reconstruction.ts` — Visual replay data model, playback controls, analysis overlays
- `audit.ts` — AuditEntry, AuditAction (35+ actions), AuditTargetType, append-only log
- `projection.ts` — ProjectionState, ProjectionConfig, ProjectionInject

### Database Schema (prisma/schema.prisma)
- All tables: User, Exercise, ExerciseParticipant, Room, RoomPlayer, Message, DirectMessage, Phase, Inject, EvaluatorNote, TimelineEvent, AuditLog
- All enums: ExerciseStatus (6 values: DRAFT/CONFIGURING/READY/LIVE/PAUSED/COMPLETED), CommunicationPreset, ParticipantRole, ParticipationMode, PlayerJoinMethod, EmailInviteTiming, RoomParticipationMode, MessageType, RfiStatus, InjectType, InjectDeliveryMethod, InjectStatus, TimelineEventType
- ExerciseParticipant has composite flag columns: isCreator, isCoPlanner, isPrimaryFacilitator, isCoFacilitator, roleName
- RoomPlayer supports multi-room membership (unique on roomId+userId+exerciseId, not roomId+userId)
- Room has isPlenary, participationMode, isVideoEnabled, and visibilityRules (JSON)
- Message has senderRoleName for role-based attribution
- DirectMessage model for player-to-player DMs with threadId grouping
- Exercise has dmPermissions (JSON) for facilitator DM control
- AuditLog: immutable append-only, indexed on exerciseId+timestamp and actorId+timestamp

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
| Multi-room membership | Players in multiple rooms become natural coordination points. Information asymmetry by design |
| Jitsi self-hosted video | Compliance-friendly, full facilitator control. Destroy meeting = cut comms |
| Keycloak as identity broker | Handles PIV/CAC, SAML, OIDC, email. One broker, all providers |
| Player-to-player DMs | Mirrors real incident response. Facilitator-controllable |
| 6-state exercise lifecycle | DRAFT→CONFIGURING→READY→LIVE→PAUSED→COMPLETED. RESUMED is a transition, not a state |
| Information asymmetry first-class | Per-room visibility rules. Facilitator controls who sees what |
| 11-step setup wizard with dry run | Guided setup prevents misconfiguration. Dry run validates timing |
| Configurable export wizard | 11 data categories, CSV/Excel, room and date filtering |
| White-card form contract | Rich inject creation during live exercises with type tags and visibility control |
| Editor-first build order | Text experience is make-or-break for adoption |
| Tiptap v2 (not Slate, not Quill) | Headless, extensible, ProseMirror core, collaboration-ready |
| Branded ID types | Prevents accidental ID mixing at compile time |
| Append-only audit log | FedRAMP-ready, no deletes ever |
| Typed error codes | Serializable over the wire, exhaustive matching |
| Cursor-based pagination | Stable under concurrent inserts |

## Lessons Learned

- Capture design conversations into contracts immediately — a long gap between discussion and documentation creates drift and lost decisions
- Contract files are cheap; missing contracts are expensive — define the type even if implementation is sprints away

## File Map
```
ARCHITECTURE.md          — Full system design (25+ sections)
SPRINT.md                — Sprint 1 plan with function signatures
CONTEXT.md               — This file
CLAUDE.md                — Project principles and workflow
src/contracts/           — TypeScript type contracts (21 files)
prisma/schema.prisma     — Database schema (12 models, 13 enums)
tests/                   — Test directory (placeholder only)
```
