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

import type { UserId, User, Role, StaffFlags, ExerciseParticipant, RolePermissions } from './user';
import type {
  ExerciseId, Exercise, ExerciseStatus, ExerciseStaff,
  ObserverConfig, ExerciseStaffMember,
  CreateExerciseInput, UpdateExerciseInput,
  ParticipationMode, PlayerJoinMethod, EmailInviteTiming,
} from './exercise';
import type { RoomId, Room, CreateRoomInput, UpdateRoomInput, RoomParticipationMode } from './room';
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
import type { AuditEntry, RecordAuditInput, AuditLogFilters } from './audit';
import type { ProjectionState, ProjectionConfig } from './projection';
import type { WhiteCardForm, WhiteCardInject } from './inject';
import type { DirectMessage, DMThread, DMPermissions, SendDMInput } from './dm';
import type { ExportId, ExportConfig, ExportResult } from './export';
import type { VideoMeetingState, JitsiCommand } from './video';
import type { BulkPlayerImport, BulkInjectImport, DryRunState, SetupWizardState, SetupWizardStep } from './exercise';
import type { AuthProvider, AuthConfig, SessionConfig, OrganizationId } from './user';
import type { VisibilityRules } from './room';

// ═══════════════════════════════════════════════════════════════
// EXERCISE SERVICE
// ═══════════════════════════════════════════════════════════════

export type ExerciseService = {
  /**
   * Create a new exercise in DRAFT status.
   * Auto-creates a default "Plenary" room.
   * Sets the creator as facilitator with isCreator + isPrimaryFacilitator flags.
   */
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

  /** Delete an exercise. Only allowed in DRAFT status. Creator-only. Cascades to all children. */
  deleteExercise(exerciseId: ExerciseId): Promise<void>;

  /** Update participation mode (digital, facilitator_led, hybrid). */
  setParticipationMode(exerciseId: ExerciseId, mode: ParticipationMode): Promise<Exercise>;

  /** Update projection configuration. */
  setProjectionConfig(exerciseId: ExerciseId, config: ProjectionConfig): Promise<Exercise>;
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

  /** Delete a room. Only allowed when exercise is in DRAFT. Cannot delete the plenary room. */
  deleteRoom(roomId: RoomId): Promise<void>;

  /** Add a player to a room by user ID. */
  addPlayer(roomId: RoomId, userId: UserId): Promise<Room>;

  /** Remove a player from a room. */
  removePlayer(roomId: RoomId, userId: UserId): Promise<Room>;

  /** Look up a room by its join code. Returns room + exercise info for the join flow. */
  findByJoinCode(joinCode: string): Promise<{ room: Room; exerciseId: ExerciseId; exerciseTitle: string }>;

  /** Generate a unique join code (e.g., 'SOC-7X3K'). */
  generateJoinCode(roomName: string): Promise<string>;

  /** Set per-room participation mode (for hybrid exercises). */
  setRoomParticipationMode(roomId: RoomId, mode: RoomParticipationMode): Promise<Room>;

  /** Add a player to multiple rooms (multi-room membership). */
  addPlayerToRooms(exerciseId: ExerciseId, userId: UserId, roomIds: RoomId[], primaryRoomId: RoomId): Promise<void>;

  /** Set a player's primary room. */
  setPrimaryRoom(exerciseId: ExerciseId, userId: UserId, roomId: RoomId): Promise<void>;

  /** Get all rooms a player belongs to. */
  getPlayerRooms(exerciseId: ExerciseId, userId: UserId): Promise<Room[]>;

  /** Set visibility rules for a room (information asymmetry). */
  setVisibilityRules(roomId: RoomId, rules: VisibilityRules): Promise<Room>;

  /** Get rooms visible to a player (based on their room's visibility rules). */
  getVisibleRooms(exerciseId: ExerciseId, userId: UserId): Promise<Room[]>;

  /** Enable/disable video for a room. */
  setVideoEnabled(roomId: RoomId, isEnabled: boolean): Promise<Room>;
};

// ═══════════════════════════════════════════════════════════════
// MESSAGE SERVICE
// ═══════════════════════════════════════════════════════════════

export type MessageService = {
  /**
   * Send a message to a room. Validates sender permissions.
   * Automatically attaches senderRoleName from the participant's exercise role.
   */
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

  /**
   * White-card an inject — create and deliver a live inject during an exercise.
   * Used by facilitators/co-facilitators for improvised injects.
   */
  whiteCardInject(exerciseId: ExerciseId, facilitatorId: UserId, form: WhiteCardForm): Promise<WhiteCardInject>;

  /** Mark an inject as read by a player. */
  markInjectRead(injectId: InjectId): Promise<Inject>;

  /** Advance to the next phase. Completes current phase, starts next. */
  advancePhase(exerciseId: ExerciseId): Promise<Phase>;

  /** Get the current active phase. Returns null if exercise hasn't started (legitimate state, not an error). */
  getCurrentPhase(exerciseId: ExerciseId): Promise<Phase | null>;

  /** Get all auto-deliverable injects that should fire now (based on phase elapsed time). */
  getDueInjects(phaseId: PhaseId, elapsedSeconds: number): Promise<Inject[]>;

  /** Update an inject. Only allowed when exercise is in DRAFT. */
  updateInject(injectId: InjectId, input: Partial<CreateInjectInput>): Promise<Inject>;

  /** Delete an inject. Only allowed when exercise is in DRAFT. */
  deleteInject(injectId: InjectId): Promise<void>;

  /**
   * Push an inject to the master projection display.
   * Used in facilitator-led mode where projection is the primary delivery channel.
   */
  showOnProjection(injectId: InjectId, exerciseId: ExerciseId): Promise<void>;

  /** Remove an inject from the master projection display. */
  clearFromProjection(exerciseId: ExerciseId): Promise<void>;
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
  /**
   * Add a staff member with role and flags.
   * Generic method — use the convenience methods below for common cases.
   */
  addStaffMember(
    exerciseId: ExerciseId,
    userId: UserId,
    role: Role,
    flags: Partial<StaffFlags>,
    assignedRoomIds?: RoomId[]
  ): Promise<ExerciseParticipant>;

  /** Add a co-planner (design-phase collaborator). */
  addCoPlanner(exerciseId: ExerciseId, userId: UserId): Promise<ExerciseParticipant>;

  /** Set the primary facilitator for live exercise control. */
  setPrimaryFacilitator(exerciseId: ExerciseId, userId: UserId): Promise<ExerciseParticipant>;

  /** Add a co-facilitator (live-phase assistant). */
  addCoFacilitator(exerciseId: ExerciseId, userId: UserId): Promise<ExerciseParticipant>;

  /** Add an evaluator with room assignments. */
  addEvaluator(exerciseId: ExerciseId, userId: UserId, assignedRoomIds: RoomId[]): Promise<ExerciseParticipant>;

  /** Update an evaluator's room assignments. */
  updateEvaluatorAssignment(exerciseId: ExerciseId, userId: UserId, assignedRoomIds: RoomId[]): Promise<ExerciseParticipant>;

  /** Configure observer access settings. */
  setObserverConfig(exerciseId: ExerciseId, config: ObserverConfig): Promise<ObserverConfig>;

  /** Generate a shareable observer link token. */
  generateObserverToken(exerciseId: ExerciseId): Promise<string>;

  /** Validate an observer token. Returns null for invalid/expired tokens (not an error — expected for bad links). */
  validateObserverToken(token: string): Promise<{ exerciseId: ExerciseId } | null>;

  /** Get a user's role, flags, and permissions. Returns null if user is not a participant (legitimate query). */
  getParticipant(exerciseId: ExerciseId, userId: UserId): Promise<ExerciseParticipant | null>;

  /** Get all staff for an exercise. */
  getStaff(exerciseId: ExerciseId): Promise<ExerciseStaff>;

  /** Get permissions for a role + flags combination. Pure function, no DB call. */
  getPermissions(role: Role, flags: StaffFlags): RolePermissions;

  /** Check if a user can view a specific room. */
  canViewRoom(exerciseId: ExerciseId, userId: UserId, roomId: RoomId): Promise<boolean>;

  /** Remove a participant from an exercise. */
  removeParticipant(exerciseId: ExerciseId, userId: UserId): Promise<void>;

  /**
   * Transfer exercise ownership (creator flag) to another user.
   * Creator-only. The new owner must already be a participant.
   */
  transferOwnership(exerciseId: ExerciseId, newOwnerId: UserId): Promise<Exercise>;

  /**
   * Transfer a player's role to another user mid-exercise.
   * Messages stay attributed to the role name (not the person).
   * The old player loses access immediately.
   */
  transferRole(exerciseId: ExerciseId, fromUserId: UserId, toUserId: UserId, roomId: RoomId): Promise<ExerciseParticipant>;
};

// ═══════════════════════════════════════════════════════════════
// AUTH SERVICE
// ═══════════════════════════════════════════════════════════════

export type AuthService = {
  /** Get or create a user by email. Used during login/signup. */
  getOrCreateUser(email: string, displayName: string): Promise<User>;

  /** Get user by ID. Throws if not found. */
  getUser(userId: UserId): Promise<User>;

  /** Get user by email. Returns null if not found (legitimate lookup, not an error). */
  getUserByEmail(email: string): Promise<User | null>;

  /** Update user profile. */
  updateUser(userId: UserId, input: { displayName?: string; avatarUrl?: string | null }): Promise<User>;

  /**
   * Authenticate using an external provider (SAML, OIDC, PIV/CAC).
   * Token format depends on provider type.
   */
  authenticateWithProvider(provider: AuthProvider, token: string): Promise<User>;

  /** Configure SSO settings for an organization. Creator/admin only. */
  configureSSOForOrg(orgId: OrganizationId, config: AuthConfig): Promise<AuthConfig>;

  /** Rotate a session token. Called periodically per SessionConfig. */
  rotateSessionToken(sessionId: string): Promise<{ newToken: string; expiresAt: Date }>;

  /** Get session configuration (org-level or default). */
  getSessionConfig(orgId?: OrganizationId): Promise<SessionConfig>;
};

// ═══════════════════════════════════════════════════════════════
// AUDIT SERVICE
// ═══════════════════════════════════════════════════════════════

export type AuditService = {
  /** Record an audit entry. Append-only — never updates or deletes. */
  recordAction(input: RecordAuditInput): Promise<AuditEntry>;

  /** Get audit log entries with optional filters. Ordered by timestamp descending. */
  getAuditLog(filters: AuditLogFilters): Promise<AuditEntry[]>;

  /** Get all audit entries for a specific user. */
  getAuditLogForUser(userId: UserId, filters?: Omit<AuditLogFilters, 'actorId'>): Promise<AuditEntry[]>;
};

// ═══════════════════════════════════════════════════════════════
// PROJECTION SERVICE
// ═══════════════════════════════════════════════════════════════

export type ProjectionService = {
  /** Get the current projection state for an exercise. */
  getProjectionState(exerciseId: ExerciseId): Promise<ProjectionState>;

  /** Get projection state scoped to a specific room (plenary + room-specific injects). */
  getRoomProjectionState(exerciseId: ExerciseId, roomId: RoomId): Promise<ProjectionState>;

  /** Update projection configuration. */
  updateProjectionConfig(exerciseId: ExerciseId, config: Partial<ProjectionConfig>): Promise<ProjectionConfig>;
};

// ═══════════════════════════════════════════════════════════════
// JOIN SERVICE (player join flow)
// ═══════════════════════════════════════════════════════════════

export type JoinService = {
  /** Generate an exercise-level join code for room code join method. */
  generateExerciseCode(exerciseId: ExerciseId): Promise<string>;

  /** Look up an exercise by its join code. Returns exercise info for the lobby. */
  findByExerciseCode(code: string): Promise<{ exerciseId: ExerciseId; exerciseTitle: string } | null>;

  /**
   * Player joins via room code. Lands in lobby until facilitator assigns.
   * Creates an unassigned ExerciseParticipant.
   */
  joinLobby(exerciseId: ExerciseId, userId: UserId, displayName: string): Promise<ExerciseParticipant>;

  /** Get all players currently in the lobby (unassigned). */
  getLobbyPlayers(exerciseId: ExerciseId): Promise<ExerciseParticipant[]>;

  /** Facilitator assigns a lobby player to a room with a role name. */
  assignFromLobby(exerciseId: ExerciseId, userId: UserId, roomId: RoomId): Promise<ExerciseParticipant>;

  /**
   * Send email invites to pre-assigned participants.
   * Each email contains a magic link that lands directly in their assigned role.
   */
  sendInvites(exerciseId: ExerciseId, timing: EmailInviteTiming): Promise<{ sent: number; failed: string[] }>;

  /** Validate a magic link token from an email invite. */
  validateInviteToken(token: string): Promise<{ exerciseId: ExerciseId; userId: UserId; roomId: RoomId } | null>;
};

// ═══════════════════════════════════════════════════════════════
// VIDEO SERVICE (Jitsi integration)
// ═══════════════════════════════════════════════════════════════

export type VideoService = {
  /** Create a Jitsi meeting for a room. Returns meeting state. */
  createMeeting(exerciseId: ExerciseId, roomId: RoomId): Promise<VideoMeetingState>;

  /** Destroy a meeting (cuts comms for that room). */
  destroyMeeting(exerciseId: ExerciseId, roomId: RoomId): Promise<void>;

  /** Get current video state for a room. */
  getVideoState(roomId: RoomId): Promise<VideoMeetingState | null>;

  /** Mute a participant in a room's meeting. */
  muteParticipant(roomId: RoomId, userId: UserId): Promise<void>;

  /** Unmute a participant. */
  unmuteParticipant(roomId: RoomId, userId: UserId): Promise<void>;

  /** Kick a participant from a room's video call. */
  kickParticipant(roomId: RoomId, userId: UserId): Promise<void>;

  /** Execute a Jitsi command (generic). */
  executeCommand(exerciseId: ExerciseId, command: JitsiCommand): Promise<void>;

  /** Generate a JWT token for a user to join a Jitsi meeting. */
  generateJitsiToken(userId: UserId, roomId: RoomId): Promise<string>;
};

// ═══════════════════════════════════════════════════════════════
// DM SERVICE (direct messages)
// ═══════════════════════════════════════════════════════════════

export type DMService = {
  /** Send a direct message. Validates DM permissions first. */
  sendDM(senderId: UserId, input: SendDMInput): Promise<DirectMessage>;

  /** Get or create a DM thread between two users in an exercise. */
  getDMThread(exerciseId: ExerciseId, userIdA: UserId, userIdB: UserId): Promise<DMThread>;

  /** Get all DM threads for a user in an exercise. */
  getThreadsForUser(exerciseId: ExerciseId, userId: UserId): Promise<DMThread[]>;

  /** Get messages in a DM thread, paginated. */
  getThreadMessages(threadId: string, options: { limit: number; before?: Date }): Promise<DirectMessage[]>;

  /** Mark all messages in a thread as read for a user. */
  markAsRead(threadId: string, userId: UserId): Promise<void>;

  /** Facilitator: enable or disable DMs for an exercise. */
  setDMEnabled(exerciseId: ExerciseId, isEnabled: boolean): Promise<DMPermissions>;

  /** Facilitator: restrict a specific player from DMs. */
  restrictPlayer(exerciseId: ExerciseId, userId: UserId): Promise<DMPermissions>;

  /** Facilitator: unrestrict a player. */
  unrestrictPlayer(exerciseId: ExerciseId, userId: UserId): Promise<DMPermissions>;

  /** Get current DM permissions for an exercise. */
  getDMPermissions(exerciseId: ExerciseId): Promise<DMPermissions>;
};

// ═══════════════════════════════════════════════════════════════
// EXPORT SERVICE
// ═══════════════════════════════════════════════════════════════

export type ExportService = {
  /** Start an export job. Returns immediately with export ID; processing is async. */
  generateExport(userId: UserId, config: ExportConfig): Promise<ExportResult>;

  /** Check the status of an export job. */
  getExportStatus(exportId: ExportId): Promise<ExportResult>;

  /** Get the download URL for a completed export. Throws if not completed. */
  downloadExport(exportId: ExportId): Promise<{ url: string; expiresAt: Date }>;

  /** List all exports for an exercise. */
  listExports(exerciseId: ExerciseId): Promise<ExportResult[]>;
};

// ═══════════════════════════════════════════════════════════════
// SETUP SERVICE (wizard + bulk import + dry run)
// ═══════════════════════════════════════════════════════════════

export type SetupService = {
  /** Get current wizard state for an exercise. */
  getWizardState(exerciseId: ExerciseId): Promise<SetupWizardState>;

  /** Mark a wizard step as completed. */
  completeStep(exerciseId: ExerciseId, step: SetupWizardStep): Promise<SetupWizardState>;

  /** Skip a wizard step. */
  skipStep(exerciseId: ExerciseId, step: SetupWizardStep): Promise<SetupWizardState>;

  /** Parse and validate a CSV for bulk player import. Does not persist. */
  parsePlayerCSV(csvData: string): Promise<BulkPlayerImport>;

  /** Execute a validated bulk player import. */
  importPlayers(exerciseId: ExerciseId, importData: BulkPlayerImport): Promise<{ imported: number; errors: string[] }>;

  /** Parse and validate a CSV for bulk inject import. Does not persist. */
  parseInjectCSV(csvData: string): Promise<BulkInjectImport>;

  /** Execute a validated bulk inject import. */
  importInjects(exerciseId: ExerciseId, importData: BulkInjectImport): Promise<{ imported: number; errors: string[] }>;

  /** Start a dry run — facilitator previews inject timeline without players. */
  startDryRun(exerciseId: ExerciseId): Promise<DryRunState>;

  /** Advance the dry run clock by a number of seconds. */
  advanceDryRun(exerciseId: ExerciseId, seconds: number): Promise<DryRunState>;

  /** End the dry run. */
  endDryRun(exerciseId: ExerciseId): Promise<void>;
};
