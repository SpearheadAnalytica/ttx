/**
 * Service function signatures — every business logic function with typed params and returns.
 * Implementation code in src/server/services/ must match these signatures exactly.
 *
 * Organized by domain. Each function documents:
 * - Purpose (one line)
 * - Parameters (typed)
 * - Return value (typed)
 * - Throws (when it fails loudly)
 */

import type { UserId, User, Role, ExerciseParticipant, RolePermissions } from './user';
import type {
  ExerciseId, Exercise, ExerciseStatus, ExerciseStaff,
  ObserverConfig, EvaluatorAssignment,
  CreateExerciseInput, UpdateExerciseInput,
} from './exercise';
import type { RoomId, Room, CreateRoomInput, UpdateRoomInput } from './room';
import type {
  MessageId, Message, MessageType, RichTextContent, Attachment,
  SendMessageInput, SendRfiInput, RespondToRfiInput, DeferRfiInput, RedirectRfiInput,
  RfiStatus,
} from './message';
import type {
  PhaseId, InjectId, Phase, Inject, InjectStatus,
  CreatePhaseInput, CreateInjectInput,
} from './inject';
import type {
  CommunicationPreset, CommunicationMatrix, CommunicationMode,
  CommunicationChangeInput, BuildMatrixInput,
} from './communication';
import type {
  NoteId, EvaluatorNote, QuickTag, Rating, NoteSummary,
  CreateNoteInput, UpdateNoteInput,
} from './evaluator';
import type { TimelineEvent, TimelineEventType } from './timeline';

// ═══════════════════════════════════════════════════════════════
// EXERCISE SERVICE
// ═══════════════════════════════════════════════════════════════

export type ExerciseService = {
  /** Create a new exercise in DRAFT status. */
  createExercise(input: CreateExerciseInput, creatorId: UserId): Promise<Exercise>;

  /** Get exercise by ID. Throws if not found. */
  getExercise(exerciseId: ExerciseId): Promise<Exercise>;

  /** List all exercises for a user (any role). */
  listExercises(userId: UserId): Promise<Exercise[]>;

  /** Update exercise settings. Throws if not in DRAFT status. */
  updateExercise(exerciseId: ExerciseId, input: UpdateExerciseInput): Promise<Exercise>;

  /** Transition exercise status. Enforces valid transitions. */
  changeStatus(exerciseId: ExerciseId, newStatus: ExerciseStatus): Promise<Exercise>;

  /** Start the exercise: set status to ACTIVE, start phase 1, record startedAt. */
  startExercise(exerciseId: ExerciseId): Promise<Exercise>;

  /** Pause a running exercise. */
  pauseExercise(exerciseId: ExerciseId): Promise<Exercise>;

  /** Resume a paused exercise. */
  resumeExercise(exerciseId: ExerciseId): Promise<Exercise>;

  /** Complete the exercise: set status to COMPLETED, record completedAt. */
  completeExercise(exerciseId: ExerciseId): Promise<Exercise>;

  /** Delete an exercise. Only allowed in DRAFT status. Cascades to all children. */
  deleteExercise(exerciseId: ExerciseId): Promise<void>;
};

// ═══════════════════════════════════════════════════════════════
// ROOM SERVICE
// ═══════════════════════════════════════════════════════════════

export type RoomService = {
  /** Create a room within an exercise. Auto-generates a join code. */
  createRoom(exerciseId: ExerciseId, input: CreateRoomInput): Promise<Room>;

  /** Get room by ID. Throws if not found. */
  getRoom(roomId: RoomId): Promise<Room>;

  /** List all rooms for an exercise. */
  listRooms(exerciseId: ExerciseId): Promise<Room[]>;

  /** Update room settings. */
  updateRoom(roomId: RoomId, input: UpdateRoomInput): Promise<Room>;

  /** Delete a room. Only allowed when exercise is in DRAFT. */
  deleteRoom(roomId: RoomId): Promise<void>;

  /** Add a player to a room by user ID. */
  addPlayer(roomId: RoomId, userId: UserId): Promise<Room>;

  /** Remove a player from a room. */
  removePlayer(roomId: RoomId, userId: UserId): Promise<Room>;

  /** Look up a room by its join code. Returns room + exercise info for the join flow. */
  findByJoinCode(joinCode: string): Promise<{ room: Room; exerciseId: ExerciseId; exerciseTitle: string }>;

  /** Generate a unique join code (e.g., 'SOC-7X3K'). */
  generateJoinCode(roomName: string): Promise<string>;
};

// ═══════════════════════════════════════════════════════════════
// MESSAGE SERVICE
// ═══════════════════════════════════════════════════════════════

export type MessageService = {
  /** Send a message to a room. Validates sender permissions. */
  sendMessage(exerciseId: ExerciseId, senderId: UserId, input: SendMessageInput): Promise<Message>;

  /** Get messages for a room, paginated. Newest first. */
  getMessages(roomId: RoomId, options: { limit: number; before?: Date }): Promise<Message[]>;

  /** Get a single message by ID. Throws if not found. */
  getMessage(messageId: MessageId): Promise<Message>;

  /** Submit an RFI from a player to White Cell. Creates an rfi_request message. */
  submitRfi(exerciseId: ExerciseId, senderId: UserId, input: SendRfiInput): Promise<Message>;

  /** Facilitator responds to an RFI. Creates an rfi_response message, updates original RFI status. */
  respondToRfi(exerciseId: ExerciseId, facilitatorId: UserId, input: RespondToRfiInput): Promise<Message>;

  /** Facilitator defers an RFI. Updates status to DEFERRED. */
  deferRfi(facilitatorId: UserId, input: DeferRfiInput): Promise<Message>;

  /** Facilitator redirects an RFI to another room. Updates status to REDIRECTED. */
  redirectRfi(facilitatorId: UserId, input: RedirectRfiInput): Promise<Message>;

  /** Get all pending RFIs for an exercise (facilitator queue). */
  getPendingRfis(exerciseId: ExerciseId): Promise<Message[]>;

  /** Get RFI by its rfiId. Returns the request + response (if any). */
  getRfiThread(rfiId: string): Promise<{ request: Message; response: Message | null }>;
};

// ═══════════════════════════════════════════════════════════════
// INJECT SERVICE
// ═══════════════════════════════════════════════════════════════

export type InjectService = {
  /** Create a phase within an exercise. */
  createPhase(exerciseId: ExerciseId, input: CreatePhaseInput): Promise<Phase>;

  /** Get all phases for an exercise, ordered. */
  getPhases(exerciseId: ExerciseId): Promise<Phase[]>;

  /** Create an inject within a phase. */
  createInject(exerciseId: ExerciseId, input: CreateInjectInput): Promise<Inject>;

  /** Get all injects for a phase, ordered by delay. */
  getInjects(phaseId: PhaseId): Promise<Inject[]>;

  /** Manually deliver an inject to its target room. Creates a Message of type INJECT. */
  deliverInject(injectId: InjectId, exerciseId: ExerciseId): Promise<{ inject: Inject; message: Message }>;

  /** Mark an inject as read by a player. */
  markInjectRead(injectId: InjectId): Promise<Inject>;

  /** Advance to the next phase. Completes current phase, starts next. */
  advancePhase(exerciseId: ExerciseId): Promise<Phase>;

  /** Get the current active phase. Returns null if exercise hasn't started. */
  getCurrentPhase(exerciseId: ExerciseId): Promise<Phase | null>;

  /** Get all auto-deliverable injects that should fire now (based on phase elapsed time). */
  getDueInjects(phaseId: PhaseId, elapsedSeconds: number): Promise<Inject[]>;

  /** Update an inject. Only allowed when exercise is in DRAFT. */
  updateInject(injectId: InjectId, input: Partial<CreateInjectInput>): Promise<Inject>;

  /** Delete an inject. Only allowed when exercise is in DRAFT. */
  deleteInject(injectId: InjectId): Promise<void>;
};

// ═══════════════════════════════════════════════════════════════
// COMMUNICATION SERVICE
// ═══════════════════════════════════════════════════════════════

export type CommunicationService = {
  /** Build a default communication matrix for a given preset. */
  buildMatrix(input: BuildMatrixInput): CommunicationMatrix;

  /** Get the communication mode between two rooms. Defaults to 'blocked' if not in matrix. */
  getMode(matrix: CommunicationMatrix, fromRoomId: RoomId, toRoomId: RoomId): CommunicationMode;

  /** Check if a direct message is allowed between two rooms. */
  canMessageDirectly(matrix: CommunicationMatrix, fromRoomId: RoomId, toRoomId: RoomId): boolean;

  /** Get all rooms a given room can contact (direct or routed). */
  getContactableRooms(matrix: CommunicationMatrix, fromRoomId: RoomId): Array<{ roomId: RoomId; mode: CommunicationMode }>;

  /** Apply mid-exercise communication changes. Returns updated matrix. Optionally triggers inject. */
  applyChange(exerciseId: ExerciseId, input: CommunicationChangeInput): Promise<{ matrix: CommunicationMatrix; inject: Inject | null }>;

  /** Validate that a matrix is well-formed (all room IDs exist, no self-references). */
  validateMatrix(matrix: CommunicationMatrix, roomIds: RoomId[]): { isValid: boolean; errors: string[] };
};

// ═══════════════════════════════════════════════════════════════
// EVALUATOR SERVICE
// ═══════════════════════════════════════════════════════════════

export type EvaluatorService = {
  /** Create a new evaluator note. */
  createNote(exerciseId: ExerciseId, evaluatorId: UserId, input: CreateNoteInput): Promise<EvaluatorNote>;

  /** Update an existing note. Only the note's author can update. */
  updateNote(noteId: NoteId, evaluatorId: UserId, input: UpdateNoteInput): Promise<EvaluatorNote>;

  /** Delete a note. Only the note's author can delete. */
  deleteNote(noteId: NoteId, evaluatorId: UserId): Promise<void>;

  /** Get all notes for an exercise by a specific evaluator. */
  getNotesByEvaluator(exerciseId: ExerciseId, evaluatorId: UserId): Promise<EvaluatorNote[]>;

  /** Get all notes for a specific room across all evaluators. */
  getNotesByRoom(exerciseId: ExerciseId, roomId: RoomId): Promise<EvaluatorNote[]>;

  /** Get notes filtered by tag. */
  getNotesByTag(exerciseId: ExerciseId, tag: QuickTag): Promise<EvaluatorNote[]>;

  /** Get summary statistics for an evaluator's notes. */
  getNoteSummary(exerciseId: ExerciseId, evaluatorId: UserId): Promise<NoteSummary>;

  /** Export all notes for an exercise as structured data (for AAR generation). */
  exportNotes(exerciseId: ExerciseId): Promise<{
    notes: EvaluatorNote[];
    byRoom: Record<string, EvaluatorNote[]>;
    byTag: Record<string, EvaluatorNote[]>;
    byEvaluator: Record<string, EvaluatorNote[]>;
  }>;
};

// ═══════════════════════════════════════════════════════════════
// TIMELINE SERVICE
// ═══════════════════════════════════════════════════════════════

export type TimelineService = {
  /** Record a new timeline event. Called internally by other services. */
  recordEvent(
    exerciseId: ExerciseId,
    type: TimelineEventType,
    summary: string,
    options?: { roomId?: RoomId; actorId?: UserId; metadata?: Record<string, unknown> }
  ): Promise<TimelineEvent>;

  /** Get all timeline events for an exercise, ordered by time. */
  getTimeline(exerciseId: ExerciseId, options?: { limit?: number; before?: Date; types?: TimelineEventType[] }): Promise<TimelineEvent[]>;

  /** Get timeline events for a specific room. */
  getRoomTimeline(exerciseId: ExerciseId, roomId: RoomId): Promise<TimelineEvent[]>;
};

// ═══════════════════════════════════════════════════════════════
// STAFF SERVICE (role management)
// ═══════════════════════════════════════════════════════════════

export type StaffService = {
  /** Add a facilitator to an exercise. */
  addFacilitator(exerciseId: ExerciseId, userId: UserId): Promise<ExerciseParticipant>;

  /** Add an evaluator with room assignments. */
  addEvaluator(exerciseId: ExerciseId, userId: UserId, assignedRoomIds: RoomId[]): Promise<ExerciseParticipant>;

  /** Update an evaluator's room assignments. */
  updateEvaluatorAssignment(exerciseId: ExerciseId, userId: UserId, assignedRoomIds: RoomId[]): Promise<ExerciseParticipant>;

  /** Configure observer access settings. */
  setObserverConfig(exerciseId: ExerciseId, config: ObserverConfig): Promise<ObserverConfig>;

  /** Generate a shareable observer link token. */
  generateObserverToken(exerciseId: ExerciseId): Promise<string>;

  /** Validate an observer token. Returns exercise ID if valid. */
  validateObserverToken(token: string): Promise<{ exerciseId: ExerciseId } | null>;

  /** Get a user's role and permissions for a specific exercise. */
  getParticipant(exerciseId: ExerciseId, userId: UserId): Promise<ExerciseParticipant | null>;

  /** Get all staff for an exercise, grouped by role. */
  getStaff(exerciseId: ExerciseId): Promise<ExerciseStaff>;

  /** Get permissions for a role. Pure function, no DB call. */
  getPermissions(role: Role): RolePermissions;

  /** Check if a user can view a specific room. */
  canViewRoom(exerciseId: ExerciseId, userId: UserId, roomId: RoomId): Promise<boolean>;

  /** Remove a participant from an exercise. */
  removeParticipant(exerciseId: ExerciseId, userId: UserId): Promise<void>;
};

// ═══════════════════════════════════════════════════════════════
// AUTH SERVICE
// ═══════════════════════════════════════════════════════════════

export type AuthService = {
  /** Get or create a user by email. Used during login/signup. */
  getOrCreateUser(email: string, displayName: string): Promise<User>;

  /** Get user by ID. Throws if not found. */
  getUser(userId: UserId): Promise<User>;

  /** Get user by email. Returns null if not found. */
  getUserByEmail(email: string): Promise<User | null>;

  /** Update user profile. */
  updateUser(userId: UserId, input: { displayName?: string; avatarUrl?: string | null }): Promise<User>;
};
