/**
 * User & Role contracts — single source of truth for identity and permissions.
 */

export type UserId = string & { readonly __brand: 'UserId' };

export type Role = 'facilitator' | 'evaluator' | 'observer' | 'player';

export type User = {
  id: UserId;
  email: string;
  displayName: string;
  avatarUrl: string | null;
  createdAt: Date;
};

/**
 * A user's role within a specific exercise.
 * The same user can be a facilitator in one exercise and a player in another.
 */
export type ExerciseParticipant = {
  userId: UserId;
  exerciseId: string;
  role: Role;
  /** For evaluators: which rooms they can observe. Empty = all rooms. */
  assignedRoomIds: string[];
  joinedAt: Date;
};

/**
 * Permissions derived from role. Used to gate UI and server-side checks.
 * Never store permissions directly — always derive from role.
 */
export type RolePermissions = {
  canSendMessages: boolean;
  canSendInjects: boolean;
  canRespondToRfis: boolean;
  canTakeNotes: boolean;
  canRateResponses: boolean;
  canViewAllRooms: boolean;
  canModifyExercise: boolean;
  canModifyCommunicationRules: boolean;
  canControlTiming: boolean;
};

export const ROLE_PERMISSIONS: Record<Role, RolePermissions> = {
  facilitator: {
    canSendMessages: true,
    canSendInjects: true,
    canRespondToRfis: true,
    canTakeNotes: false,
    canRateResponses: false,
    canViewAllRooms: true,
    canModifyExercise: true,
    canModifyCommunicationRules: true,
    canControlTiming: true,
  },
  evaluator: {
    canSendMessages: false,
    canSendInjects: false,
    canRespondToRfis: false,
    canTakeNotes: true,
    canRateResponses: true,
    canViewAllRooms: false, // depends on assignedRoomIds
    canModifyExercise: false,
    canModifyCommunicationRules: false,
    canControlTiming: false,
  },
  observer: {
    canSendMessages: false,
    canSendInjects: false,
    canRespondToRfis: false,
    canTakeNotes: false,
    canRateResponses: false,
    canViewAllRooms: true,
    canModifyExercise: false,
    canModifyCommunicationRules: false,
    canControlTiming: false,
  },
  player: {
    canSendMessages: true,
    canSendInjects: false,
    canRespondToRfis: false,
    canTakeNotes: false,
    canRateResponses: false,
    canViewAllRooms: false,
    canModifyExercise: false,
    canModifyCommunicationRules: false,
    canControlTiming: false,
  },
};
