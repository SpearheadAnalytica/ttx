/**
 * Zustand store contracts — every client-side state variable and action.
 * Implementation code in src/stores/ must match these types exactly.
 *
 * State variables are the source of truth for what the UI renders.
 * Actions are the only way to modify state.
 */

import type { UserId, User, Role, RolePermissions } from './user';
import type { ExerciseId, Exercise, ExerciseStatus } from './exercise';
import type { RoomId, Room } from './room';
import type { MessageId, Message, RichTextContent, RfiStatus } from './message';
import type { PhaseId, Phase, Inject, InjectStatus } from './inject';
import type { CommunicationMatrix, CommunicationMode } from './communication';
import type { EvaluatorNote, QuickTag, Rating, NoteId } from './evaluator';
import type { TimelineEvent } from './timeline';

// ═══════════════════════════════════════════════════════════════
// AUTH STORE — current user identity
// ═══════════════════════════════════════════════════════════════

export type AuthStore = {
  // ── State ──
  currentUser: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;

  // ── Actions ──
  setUser: (user: User) => void;
  clearUser: () => void;
  setLoading: (isLoading: boolean) => void;
};

// ═══════════════════════════════════════════════════════════════
// EXERCISE STORE — exercise metadata and lifecycle
// ═══════════════════════════════════════════════════════════════

export type ExerciseStore = {
  // ── State ──
  exercise: Exercise | null;
  /** Current user's role in this exercise. */
  currentRole: Role | null;
  /** Current user's permissions (derived from role). */
  permissions: RolePermissions | null;
  /** Elapsed time since exercise started (seconds). Updated by timer. */
  elapsedSeconds: number;
  /** Whether the exercise clock is ticking. */
  isTimerRunning: boolean;
  isLoading: boolean;
  error: string | null;

  // ── Actions ──
  setExercise: (exercise: Exercise) => void;
  setRole: (role: Role, permissions: RolePermissions) => void;
  updateStatus: (status: ExerciseStatus) => void;
  tickTimer: () => void;
  setTimerRunning: (isRunning: boolean) => void;
  setLoading: (isLoading: boolean) => void;
  setError: (error: string | null) => void;
  reset: () => void;
};

// ═══════════════════════════════════════════════════════════════
// ROOM STORE — rooms and active room selection
// ═══════════════════════════════════════════════════════════════

export type RoomStore = {
  // ── State ──
  rooms: Room[];
  /** The room the user is currently viewing. */
  activeRoomId: RoomId | null;
  /** Rooms that have unread messages (for facilitator/evaluator multi-room view). */
  unreadRoomIds: Set<RoomId>;
  isLoading: boolean;

  // ── Actions ──
  setRooms: (rooms: Room[]) => void;
  addRoom: (room: Room) => void;
  updateRoom: (roomId: RoomId, updates: Partial<Room>) => void;
  removeRoom: (roomId: RoomId) => void;
  setActiveRoom: (roomId: RoomId) => void;
  markRoomRead: (roomId: RoomId) => void;
  markRoomUnread: (roomId: RoomId) => void;
  setLoading: (isLoading: boolean) => void;
};

// ═══════════════════════════════════════════════════════════════
// MESSAGE STORE — messages for the active room
// ═══════════════════════════════════════════════════════════════

export type MessageStore = {
  // ── State ──
  /** Messages for the currently active room, ordered by createdAt ascending. */
  messages: Message[];
  /** Whether we're loading historical messages (pagination). */
  isLoadingHistory: boolean;
  /** Whether there are older messages to load. */
  hasMore: boolean;
  /** Users currently typing in the active room. */
  typingUsers: Array<{ userId: UserId; displayName: string }>;
  /** Optimistic messages awaiting server confirmation. Keyed by temp ID. */
  pendingMessages: Map<string, Message>;

  // ── Actions ──
  setMessages: (messages: Message[]) => void;
  addMessage: (message: Message) => void;
  prependMessages: (messages: Message[]) => void;
  /** Add optimistic message. Replaced by real message when server confirms. */
  addPending: (tempId: string, message: Message) => void;
  /** Confirm a pending message (replace with server version). */
  confirmPending: (tempId: string, confirmedMessage: Message) => void;
  /** Remove a failed pending message. */
  removePending: (tempId: string) => void;
  setTypingUser: (userId: UserId, displayName: string) => void;
  removeTypingUser: (userId: UserId) => void;
  setLoadingHistory: (isLoading: boolean) => void;
  setHasMore: (hasMore: boolean) => void;
  clearMessages: () => void;
};

// ═══════════════════════════════════════════════════════════════
// RFI STORE — facilitator's RFI queue
// ═══════════════════════════════════════════════════════════════

export type RfiStore = {
  // ── State ──
  /** All RFIs for the exercise, newest first. */
  rfis: Array<{
    request: Message;
    response: Message | null;
    status: RfiStatus;
    /** Seconds since the RFI was submitted. */
    ageSeconds: number;
  }>;
  /** Filter: show only pending, answered, or all. */
  statusFilter: RfiStatus | 'all';
  isLoading: boolean;

  // ── Actions ──
  setRfis: (rfis: RfiStore['rfis']) => void;
  addRfi: (request: Message) => void;
  updateRfi: (rfiId: string, status: RfiStatus, response: Message | null) => void;
  setStatusFilter: (filter: RfiStatus | 'all') => void;
  tickAges: () => void;
  setLoading: (isLoading: boolean) => void;
};

// ═══════════════════════════════════════════════════════════════
// INJECT STORE — phases and inject delivery
// ═══════════════════════════════════════════════════════════════

export type InjectStore = {
  // ── State ──
  phases: Phase[];
  /** Currently active phase. */
  activePhaseId: PhaseId | null;
  /** Injects that have been delivered to the player's room. */
  deliveredInjects: Inject[];
  /** For facilitator: all injects across all phases with their status. */
  allInjects: Inject[];
  isLoading: boolean;

  // ── Actions ──
  setPhases: (phases: Phase[]) => void;
  setActivePhase: (phaseId: PhaseId) => void;
  addDeliveredInject: (inject: Inject) => void;
  updateInjectStatus: (injectId: string, status: InjectStatus) => void;
  setAllInjects: (injects: Inject[]) => void;
  setLoading: (isLoading: boolean) => void;
};

// ═══════════════════════════════════════════════════════════════
// COMMUNICATION STORE — cross-room rules and state
// ═══════════════════════════════════════════════════════════════

export type CommunicationStore = {
  // ── State ──
  matrix: CommunicationMatrix;
  /** For the current player's room: which rooms they can contact and how. */
  contactableRooms: Array<{ room: Room; mode: CommunicationMode }>;

  // ── Actions ──
  setMatrix: (matrix: CommunicationMatrix) => void;
  setContactableRooms: (rooms: CommunicationStore['contactableRooms']) => void;
  /** Update matrix when facilitator changes rules mid-exercise. */
  applyMatrixUpdate: (updates: CommunicationMatrix) => void;
};

// ═══════════════════════════════════════════════════════════════
// EVALUATOR STORE — note-taking state
// ═══════════════════════════════════════════════════════════════

export type EvaluatorStore = {
  // ── State ──
  notes: EvaluatorNote[];
  /** Currently selected tags for filtering. */
  activeTagFilter: QuickTag[];
  /** Room currently being observed. */
  observingRoomId: RoomId | null;
  /** Draft note content (auto-saved). */
  draftContent: RichTextContent | null;
  /** Draft tags. */
  draftTags: QuickTag[];
  /** Draft rating. */
  draftRating: Rating | null;
  /** Message the draft note is linked to, if any. */
  draftLinkedMessageId: MessageId | null;
  isSaving: boolean;

  // ── Actions ──
  setNotes: (notes: EvaluatorNote[]) => void;
  addNote: (note: EvaluatorNote) => void;
  updateNote: (noteId: NoteId, updates: Partial<EvaluatorNote>) => void;
  removeNote: (noteId: NoteId) => void;
  setTagFilter: (tags: QuickTag[]) => void;
  setObservingRoom: (roomId: RoomId) => void;
  setDraftContent: (content: RichTextContent | null) => void;
  setDraftTags: (tags: QuickTag[]) => void;
  toggleDraftTag: (tag: QuickTag) => void;
  setDraftRating: (rating: Rating | null) => void;
  setDraftLinkedMessage: (messageId: MessageId | null) => void;
  clearDraft: () => void;
  setSaving: (isSaving: boolean) => void;
};

// ═══════════════════════════════════════════════════════════════
// TIMELINE STORE — live event feed
// ═══════════════════════════════════════════════════════════════

export type TimelineStore = {
  // ── State ──
  events: TimelineEvent[];
  /** Filter by event type. Empty = show all. */
  typeFilter: TimelineEvent['type'][];
  /** Filter by room. Null = show all rooms. */
  roomFilter: RoomId | null;
  isLoading: boolean;

  // ── Actions ──
  setEvents: (events: TimelineEvent[]) => void;
  addEvent: (event: TimelineEvent) => void;
  setTypeFilter: (types: TimelineEvent['type'][]) => void;
  setRoomFilter: (roomId: RoomId | null) => void;
  setLoading: (isLoading: boolean) => void;
};

// ═══════════════════════════════════════════════════════════════
// SOCKET STORE — connection state
// ═══════════════════════════════════════════════════════════════

export type SocketStore = {
  // ── State ──
  isConnected: boolean;
  /** Number of reconnection attempts. */
  reconnectAttempts: number;
  /** Last error from socket. */
  lastError: string | null;

  // ── Actions ──
  setConnected: (isConnected: boolean) => void;
  incrementReconnectAttempts: () => void;
  resetReconnectAttempts: () => void;
  setLastError: (error: string | null) => void;
};
