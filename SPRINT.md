# Sprint 1 — Foundation: Project Setup, Room Chat & Rich Text Editor

## Goal

Stand up the Next.js project with the dark tactical UI, build the Tiptap rich text editor, and get a single room with live chat working end-to-end. This sprint proves the core loop: a player opens a room, types a message with rich formatting, sends it, and sees it appear in real-time.

**Why editor-first**: The text experience is the #1 adoption factor. If typing feels bad, nothing else matters. We build the editor component first and validate it before wiring up the rest.

## Sprint Scope

### 1. Project Scaffolding
**Purpose**: Get Next.js, Tailwind, shadcn/ui, and Tiptap installed and configured with the dark tactical theme.

- `initNextProject()` — Initialize Next.js 14 with App Router, TypeScript strict mode
  - Parameters: none (config-driven)
  - Returns: working `npm run dev` with blank page

- `configureTailwind()` — Set up Tailwind with dark-first theme, custom color palette (slate/zinc/emerald/amber/red), JetBrains Mono font
  - Parameters: none
  - Returns: `globals.css` with custom properties, `tailwind.config.ts` with theme extensions

- `installShadcn()` — Install shadcn/ui with dark theme defaults
  - Parameters: none
  - Returns: `components/ui/` with button, input, card, dialog, dropdown-menu, tabs, badge, tooltip

### 2. Rich Text Editor — `src/components/editor/`
**Purpose**: Build the Tiptap editor with all formatting features. This is the premium UX moment.

- `RichEditor` — Base editor component wrapping Tiptap
  - Parameters: `{ content: RichTextContent | null, onChange: (content: RichTextContent) => void, placeholder: string, variant: EditorVariant, onSubmit?: () => void, isDisabled?: boolean }`
  - Process: Initialize Tiptap with extensions, render toolbar based on variant, handle keyboard shortcuts
  - Returns: React component with Tiptap instance

- `EditorToolbar` — Formatting toolbar (fixed or floating based on variant)
  - Parameters: `{ editor: TiptapEditor, variant: EditorVariant }`
  - Process: Render formatting buttons, toggle active states, handle file attach trigger
  - Returns: React component

- `SlashCommandMenu` — Notion-style `/` command popup
  - Parameters: `{ editor: TiptapEditor }`
  - Process: Listen for `/` at line start, show filtered menu, insert selected block type
  - Returns: React component (portal)

- `MentionSuggestion` — `@mention` dropdown for players/rooms
  - Parameters: `{ items: MentionItem[], command: (item: MentionItem) => void }`
  - Returns: React component (portal)

Editor variants to build:
| Variant | Toolbar | Min Height | Submit |
|---|---|---|---|
| `chat` | Floating on select | 44px, auto-grow | Cmd+Enter |
| `note` | Fixed top | 120px, auto-grow | Cmd+Enter |
| `inject` | Fixed top | 300px, resizable | Button |
| `rfi` | Floating on select | 44px, max 200px | Cmd+Enter |
| `response` | Fixed top | 80px, auto-grow | Button |

### 3. Room Chat UI — `src/components/room/`
**Purpose**: Build the player room view with message list and chat editor.

- `RoomView` — Full room page layout
  - Parameters: `{ roomId: RoomId, exerciseId: ExerciseId }`
  - Process: Load room data, connect socket, render message list + editor
  - Returns: React component (page-level)

- `MessageList` — Scrollable message feed with auto-scroll
  - Parameters: `{ messages: Message[], currentUserId: UserId }`
  - Process: Render messages, group by sender, auto-scroll on new message, lazy-load history
  - Returns: React component

- `MessageBubble` — Individual message display with rich text rendering
  - Parameters: `{ message: Message, isOwnMessage: boolean }`
  - Process: Render Tiptap content as read-only, show sender name/avatar/timestamp
  - Returns: React component

- `ChatComposer` — Chat input area using `RichEditor` chat variant
  - Parameters: `{ onSend: (content: RichTextContent) => void, isDisabled: boolean }`
  - Process: Wrap RichEditor, handle send on Cmd+Enter, clear after send
  - Returns: React component

### 4. Socket.io Integration — `src/lib/socket.ts` + `src/server/`
**Purpose**: Real-time message delivery for the chat room.

- `createSocketServer()` — Initialize Socket.io server with room management
  - Parameters: `{ httpServer: HttpServer }`
  - Process: Set up namespaces, handle connection/disconnection, room joining
  - Returns: Socket.io Server instance

- `handleMessageSend()` — Server handler for `message:send` event
  - Parameters: `{ socket: Socket, input: SendMessageInput }`
  - Process: Validate sender permissions, persist message, broadcast to room, emit timeline event
  - Returns: `{ ok: true, message: Message }` or `{ ok: false, error: string }`

- `useSocket()` — Client hook for Socket.io connection
  - Parameters: `{ exerciseId: string, roomId?: string }`
  - Process: Connect, authenticate, join room, handle reconnection
  - Returns: `{ socket, isConnected, error }`

- `useRoomMessages()` — Client hook for room message state
  - Parameters: `{ roomId: RoomId }`
  - Process: Subscribe to `message:new`, maintain message list, handle optimistic updates
  - Returns: `{ messages, sendMessage, isLoading }`

### 5. Database Schema — `prisma/schema.prisma`
**Purpose**: Define the PostgreSQL schema matching our contracts.

- Tables needed for Sprint 1: `User`, `Exercise`, `Room`, `Message`
- Indexes on: `Message.roomId + createdAt`, `Message.exerciseId`
- Seed script with a demo exercise + 2 rooms

### 6. Tests

**E2E (Playwright)**:
- `editor-formatting.spec.ts` — Bold, italic, lists, code blocks, slash commands work
- `room-chat.spec.ts` — Send message, see it appear, rich text renders correctly
- `editor-keyboard.spec.ts` — Cmd+Enter sends, Cmd+B bolds, Tab indents

**Unit (Vitest)**:
- `role-permissions.test.ts` — ROLE_PERMISSIONS map returns correct values for each role
- `message-validation.test.ts` — SendMessageInput validation catches bad inputs

## Out of Scope (Sprint 1)

- Auth / login (hardcode a test user)
- Injects / phases
- RFIs
- Cross-room communication
- Evaluator / observer views
- File attachments (UI placeholder only)
- @mentions (UI placeholder only)

## Definition of Done

1. `npm run dev` starts the app with dark tactical theme
2. Navigate to a room, see the rich text editor
3. Type a message with bold, italic, lists, code blocks
4. Press Cmd+Enter, message appears in the feed with formatting preserved
5. Open a second browser tab — messages sync in real-time
6. All Playwright tests pass
7. All Vitest tests pass
8. No TypeScript errors (`npx tsc --noEmit`)

## Sprint Order

1. Project scaffolding + Tailwind dark theme → verify blank page renders
2. Tiptap editor component → verify formatting works in isolation
3. Room chat UI → verify messages display
4. Socket.io + database → verify real-time delivery
5. Tests → verify everything holds together
6. Polish — animations, loading states, error states
