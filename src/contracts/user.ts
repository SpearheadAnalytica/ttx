/**
 * User & Role contracts — single source of truth for identity and permissions.
 *
 * Role model uses composite flags: a participant has a base role (facilitator,
 * evaluator, observer, player) plus optional staff flags (isCreator, isCoPlanner,
 * isPrimaryFacilitator, isCoFacilitator). Permissions are derived from the
 * combination of role + flags. One person can hold multiple flags — e.g., the
 * exercise creator is often also the primary facilitator.
 */

export type UserId = string & { readonly __brand: 'UserId' };

/**
 * Base runtime role. Determines the participant's primary view and capabilities.
 * Staff flags layer additional permissions on top of this.
 */
export type Role = 'facilitator' | 'evaluator' | 'observer' | 'player';

export type User = {
  id: UserId;
  email: string;
  displayName: string;
  avatarUrl: string | null;
  createdAt: Date;
};

/**
 * Composite staff flags. These layer on top of the base Role to create
 * fine-grained permission combinations.
 *
 * Design-phase flags:
 * - isCreator: The user who created the exercise. Can assign all roles,
 *   transfer ownership, delete the exercise. Exactly one per exercise.
 * - isCoPlanner: Can help design the exercise (rooms, injects, config)
 *   but cannot assign roles or transfer ownership.
 *
 * Live-phase flags:
 * - isPrimaryFacilitator: Runs the live exercise — Go Live, Pause/Resume,
 *   Advance Phase, Broadcast to all rooms, End exercise. One per exercise.
 * - isCoFacilitator: Assists during live — deliver injects, white-card,
 *   cut/restore comms, chat in rooms. Cannot control exercise lifecycle.
 *
 * A single person can have multiple flags. Common combos:
 * - Creator + Primary Facilitator (solo facilitator)
 * - Creator + Co-Planner (someone else runs it live)
 * - Co-Planner + Co-Facilitator (design helper who also assists live)
 */
export type StaffFlags = {
  isCreator: boolean;
  isCoPlanner: boolean;
  isPrimaryFacilitator: boolean;
  isCoFacilitator: boolean;
};

/** Default flags — no special privileges. */
export const DEFAULT_STAFF_FLAGS: StaffFlags = {
  isCreator: false,
  isCoPlanner: false,
  isPrimaryFacilitator: false,
  isCoFacilitator: false,
};

/**
 * A user's participation within a specific exercise.
 * The same user can be a facilitator in one exercise and a player in another.
 */
export type ExerciseParticipant = {
  userId: UserId;
  exerciseId: string;
  role: Role;
  flags: StaffFlags;
  /** For evaluators: which rooms they can observe. Empty = all rooms. */
  assignedRoomIds: string[];
  joinedAt: Date;
};

/**
 * Full permission set derived from role + flags.
 * Never store permissions directly — always derive via derivePermissions().
 *
 * Design-phase permissions (pre-live):
 */
export type RolePermissions = {
  // ── Design-phase (pre-live) ──────────────────────────────
  canCreateExercise: boolean;
  canEditExerciseConfig: boolean;
  canAddRemoveRooms: boolean;
  canAddRemovePlayers: boolean;
  canCreateEditInjects: boolean;
  canAssignFacilitators: boolean;
  canAssignCoPlanners: boolean;
  canTogglePlayerDevices: boolean;

  // ── Live-phase ───────────────────────────────────────────
  canGoLive: boolean;
  canPauseResume: boolean;
  canAdvancePhase: boolean;
  canDeliverInjects: boolean;
  canWhiteCardInjects: boolean;
  canCutRestoreComms: boolean;
  canBroadcastAllRooms: boolean;
  canViewAllRooms: boolean;
  canViewOwnRoom: boolean;
  canChatInRoom: boolean;
  canAddNotes: boolean;
  canRateResponses: boolean;
  canExportData: boolean;
  canViewAuditLog: boolean;
  canViewMasterProjection: boolean;
};

/**
 * Derive permissions from role + staff flags.
 * This is the single source of truth for what a participant can do.
 *
 * Permission logic (matches the design conversation matrix):
 *
 * | Capability               | Creator | Co-Planner | Primary Facil | Co-Facil | Evaluator | Player | Observer |
 * |--------------------------|---------|------------|---------------|----------|-----------|--------|----------|
 * | Create exercise          | Yes     | —          | —             | —        | —         | —      | —        |
 * | Edit exercise config     | Yes     | Yes        | Yes           | No       | No        | No     | No       |
 * | Add/remove rooms         | Yes     | Yes        | No            | No       | No        | No     | No       |
 * | Add/remove players       | Yes     | Yes        | Yes           | No       | No        | No     | No       |
 * | Create/edit injects      | Yes     | Yes        | Yes           | No       | No        | No     | No       |
 * | Assign facilitators      | Yes     | No         | No            | No       | No        | No     | No       |
 * | Assign co-planners       | Yes     | No         | No            | No       | No        | No     | No       |
 * | Toggle player devices    | Yes     | Yes        | Yes           | No       | No        | No     | No       |
 * | Go Live / End            | —       | —          | Yes           | No       | No        | No     | No       |
 * | Pause / Resume           | —       | —          | Yes           | No       | No        | No     | No       |
 * | Advance phase            | —       | —          | Yes           | No       | No        | No     | No       |
 * | Deliver injects          | —       | —          | Yes           | Yes      | No        | No     | No       |
 * | White-card injects       | —       | —          | Yes           | Yes      | No        | No     | No       |
 * | Cut/restore comms        | —       | —          | Yes           | Yes      | No        | No     | No       |
 * | Broadcast (all rooms)    | —       | —          | Yes           | No       | No        | No     | No       |
 * | View all rooms           | —       | —          | Yes           | Yes      | Config    | No     | Yes      |
 * | View own room            | —       | —          | —             | —        | Config    | Yes    | —        |
 * | Chat in room             | —       | —          | Yes           | Yes      | No        | Yes    | No       |
 * | Add notes                | —       | —          | Yes           | Yes      | Yes       | No     | No       |
 * | Rate responses           | —       | —          | No            | No       | Yes       | No     | No       |
 * | Export data              | Yes     | Yes        | Yes           | Yes      | Yes       | No     | Yes      |
 * | View audit log           | Yes     | Yes        | Yes           | Yes      | No        | No     | No       |
 * | View master projection   | All     | All        | All           | All      | All       | All    | All      |
 */
export function derivePermissions(role: Role, flags: StaffFlags): RolePermissions {
  const { isCreator, isCoPlanner, isPrimaryFacilitator, isCoFacilitator } = flags;

  // Base: everyone can view the master projection
  const base: RolePermissions = {
    canCreateExercise: false,
    canEditExerciseConfig: false,
    canAddRemoveRooms: false,
    canAddRemovePlayers: false,
    canCreateEditInjects: false,
    canAssignFacilitators: false,
    canAssignCoPlanners: false,
    canTogglePlayerDevices: false,
    canGoLive: false,
    canPauseResume: false,
    canAdvancePhase: false,
    canDeliverInjects: false,
    canWhiteCardInjects: false,
    canCutRestoreComms: false,
    canBroadcastAllRooms: false,
    canViewAllRooms: false,
    canViewOwnRoom: false,
    canChatInRoom: false,
    canAddNotes: false,
    canRateResponses: false,
    canExportData: false,
    canViewAuditLog: false,
    canViewMasterProjection: true,
  };

  // Layer role-specific permissions
  switch (role) {
    case 'player':
      base.canViewOwnRoom = true;
      base.canChatInRoom = true;
      break;

    case 'observer':
      base.canViewAllRooms = true;
      // Observers are pure spectators — no notes, no interaction, no audit log
      break;

    case 'evaluator':
      // viewAllRooms depends on assignedRoomIds (empty = all)
      // handled at runtime, not here — default to own room
      base.canViewOwnRoom = true;
      base.canAddNotes = true;
      base.canRateResponses = true;
      base.canExportData = true;
      break;

    case 'facilitator':
      base.canViewAllRooms = true;
      base.canChatInRoom = true;
      base.canAddNotes = true;
      base.canExportData = true;
      base.canViewAuditLog = true;
      break;
  }

  // Layer flag-specific permissions (additive)
  if (isCreator) {
    base.canCreateExercise = true;
    base.canEditExerciseConfig = true;
    base.canAddRemoveRooms = true;
    base.canAddRemovePlayers = true;
    base.canCreateEditInjects = true;
    base.canAssignFacilitators = true;
    base.canAssignCoPlanners = true;
    base.canTogglePlayerDevices = true;
    base.canExportData = true;
    base.canViewAuditLog = true;
  }

  if (isCoPlanner) {
    base.canEditExerciseConfig = true;
    base.canAddRemoveRooms = true;
    base.canAddRemovePlayers = true;
    base.canCreateEditInjects = true;
    base.canTogglePlayerDevices = true;
    base.canExportData = true;
    base.canViewAuditLog = true;
  }

  if (isPrimaryFacilitator) {
    base.canEditExerciseConfig = true;
    base.canAddRemovePlayers = true;
    base.canCreateEditInjects = true;
    base.canTogglePlayerDevices = true;
    base.canGoLive = true;
    base.canPauseResume = true;
    base.canAdvancePhase = true;
    base.canDeliverInjects = true;
    base.canWhiteCardInjects = true;
    base.canCutRestoreComms = true;
    base.canBroadcastAllRooms = true;
    base.canViewAllRooms = true;
    base.canChatInRoom = true;
    base.canAddNotes = true;
    base.canExportData = true;
    base.canViewAuditLog = true;
  }

  if (isCoFacilitator) {
    base.canDeliverInjects = true;
    base.canWhiteCardInjects = true;
    base.canCutRestoreComms = true;
    base.canViewAllRooms = true;
    base.canChatInRoom = true;
    base.canAddNotes = true;
    base.canExportData = true;
    base.canViewAuditLog = true;
  }

  return base;
}
