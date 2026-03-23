/**
 * Exercise contracts — the top-level entity that owns rooms, phases, and staff.
 *
 * Key design decisions:
 * - Every exercise starts with one default "Plenary" room. Multi-room is opt-in.
 * - Staff uses composite flags model (see user.ts StaffFlags).
 * - Three participation modes: Digital, Facilitator-Led, Hybrid (per-room).
 * - Two player join methods: Room Code (quick) and Email Invites (pre-planned), or both.
 */

import type { UserId, Role, StaffFlags } from './user';
import type { CommunicationPreset, CommunicationMatrix } from './communication';
import type { Room } from './room';
import type { Phase } from './inject';
import type { ProjectionConfig } from './projection';

export type ExerciseId = string & { readonly __brand: 'ExerciseId' };

/**
 * Exercise lifecycle state machine.
 *
 * Valid transitions:
 *   draft → configuring → ready → live → paused → live (resume)
 *                                      → completed
 *                                live → completed
 *
 * CONFIGURING: Facilitator is setting up rooms, injects, players, etc.
 * READY: Setup complete, waiting for Go Live.
 * LIVE: Exercise is running, clock is ticking.
 * PAUSED: Clock frozen, state preserved. Resume returns to LIVE.
 */
export type ExerciseStatus = 'draft' | 'configuring' | 'ready' | 'live' | 'paused' | 'completed';

/** Valid state transitions. Used by services to enforce the state machine. */
export const VALID_TRANSITIONS: Record<ExerciseStatus, ExerciseStatus[]> = {
  draft: ['configuring'],
  configuring: ['ready'],
  ready: ['live'],
  live: ['paused', 'completed'],
  paused: ['live', 'completed'],
  completed: [],
};

// ── Observer Access ────────────────────────────────────────────

export type ObserverAccessType = 'link' | 'password' | 'email_list';

export type ObserverConfig = {
  accessType: ObserverAccessType;
  /** Required when accessType is 'password'. */
  password: string | null;
  /** Required when accessType is 'email_list'. */
  allowedEmails: string[];
  /** Token for shareable observer link. */
  linkToken: string | null;
};

// ── Participation Mode ─────────────────────────────────────────

/**
 * How players participate in the exercise.
 *
 * - digital: Players join on their own devices, chat and respond digitally.
 * - facilitator_led: No player devices. Facilitator reads injects aloud or
 *   displays them on projection. Responses are verbal. No player portal.
 * - hybrid: Per-room configuration — some rooms digital, some facilitator-led.
 */
export type ParticipationMode = 'digital' | 'facilitator_led' | 'hybrid';

// ── Player Join Method ─────────────────────────────────────────

/**
 * How players join the exercise.
 *
 * - room_code: Players join live with a code, land in a lobby, facilitator assigns roles.
 * - email_invite: Pre-assigned roles, magic link sent via email.
 * - both: Email invites for known participants + room code for walk-ins.
 */
export type PlayerJoinMethod = 'room_code' | 'email_invite' | 'both';

/**
 * When to send email invites (only relevant for email_invite or both).
 */
export type EmailInviteTiming = 'now' | 'at_exercise_start' | 'manual';

export type JoinConfig = {
  method: PlayerJoinMethod;
  /** Exercise-level join code for room_code and both methods. */
  exerciseCode: string | null;
  /** When to send email invites. Only used when method is email_invite or both. */
  emailTiming: EmailInviteTiming;
};

// ── Staff ──────────────────────────────────────────────────────

/**
 * A staff member's assignment within an exercise.
 * Combines a base role with composite staff flags.
 */
export type ExerciseStaffMember = {
  userId: UserId;
  role: Role;
  flags: StaffFlags;
  /** For evaluators: which rooms they can observe. Empty = all rooms. */
  assignedRoomIds: string[];
};

/**
 * All staff assignments for an exercise.
 */
export type ExerciseStaff = {
  members: ExerciseStaffMember[];
  observerConfig: ObserverConfig;
};

// ── Exercise ───────────────────────────────────────────────────

export type Exercise = {
  id: ExerciseId;
  title: string;
  description: string;
  status: ExerciseStatus;
  createdBy: UserId;
  staff: ExerciseStaff;
  rooms: Room[];
  phases: Phase[];
  communicationPreset: CommunicationPreset;
  communicationMatrix: CommunicationMatrix;
  /**
   * How players participate. Defaults to 'digital'.
   * When 'hybrid', each room has its own participationMode (see Room contract).
   */
  participationMode: ParticipationMode;
  /** Player join configuration. */
  joinConfig: JoinConfig;
  /** Master projection configuration. */
  projectionConfig: ProjectionConfig;
  startedAt: Date | null;
  pausedAt: Date | null;
  completedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

/** Shape for creating a new exercise. Auto-creates a default "Plenary" room. */
export type CreateExerciseInput = {
  title: string;
  description: string;
  participationMode?: ParticipationMode; // defaults to 'digital'
  joinMethod?: PlayerJoinMethod; // defaults to 'room_code'
};

/** Shape for updating exercise settings. */
export type UpdateExerciseInput = {
  title?: string;
  description?: string;
  communicationPreset?: CommunicationPreset;
  communicationMatrix?: CommunicationMatrix;
  participationMode?: ParticipationMode;
  joinMethod?: PlayerJoinMethod;
  emailTiming?: EmailInviteTiming;
};

// ── Setup Wizard ─────────────────────────────────────────────

/**
 * Steps in the exercise setup wizard.
 * Facilitator walks through these in order; some are optional.
 */
export type SetupWizardStep =
  | 'create'           // Name, description, date(s), org
  | 'scenario'         // Narrative text, background docs, starting conditions
  | 'rooms'            // Create rooms, set types, assign video
  | 'injects'          // Bulk import or create one-by-one
  | 'players'          // Add players, assign rooms/roles
  | 'facilitators'     // Add facilitators with flags
  | 'phases'           // Define phases with transition triggers
  | 'comms_rules'      // Communication matrix and presets
  | 'pre_stage_files'  // Upload docs, network diagrams, policies per room
  | 'dry_run'          // Walk through inject timeline without players
  | 'go_live';         // Start the exercise clock

/** Tracks wizard progress. */
export type SetupWizardState = {
  currentStep: SetupWizardStep;
  completedSteps: SetupWizardStep[];
  /** Steps that can be skipped (rooms, pre_stage_files are optional). */
  skippedSteps: SetupWizardStep[];
};

// ── Dry Run ──────────────────────────────────────────────────

/**
 * Dry run state — facilitator previews the inject timeline.
 * Players cannot see the exercise. Clock runs but nothing is delivered.
 */
export type DryRunState = {
  isActive: boolean;
  /** Simulated exercise clock in seconds. */
  simulatedClockSeconds: number;
  /** Current phase being previewed. */
  currentPhaseIndex: number;
  /** Injects that would have fired by this point. */
  firedInjectIds: string[];
  startedAt: Date | null;
};

// ── Bulk Import ──────────────────────────────────────────────

/** CSV row for bulk player import. */
export type BulkPlayerRow = {
  email: string;
  displayName: string;
  roomName: string;
  roleName: string;
  organization: string;
};

export type BulkPlayerImport = {
  rows: BulkPlayerRow[];
  /** Validation errors indexed by row number. */
  errors: Record<number, string[]>;
  isValid: boolean;
};

/** CSV row for bulk inject import. */
export type BulkInjectRow = {
  phaseName: string;
  title: string;
  content: string;
  targetRoomName: string;
  delayMinutes: number;
  deliveryMethod: 'auto' | 'manual';
  injectType: string;
};

export type BulkInjectImport = {
  rows: BulkInjectRow[];
  errors: Record<number, string[]>;
  isValid: boolean;
};

// ── DM Permissions (Exercise-Level) ──────────────────────────

/**
 * Exercise-level DM configuration. Duplicated here to avoid circular
 * import (dm.ts imports ExerciseId from exercise.ts).
 */
export type ExerciseDMConfig = {
  /** Master toggle — when false, no DMs allowed in this exercise. */
  isEnabled: boolean;
  /** Players who are blocked from sending/receiving DMs. */
  restrictedPlayerIds: string[];
};
