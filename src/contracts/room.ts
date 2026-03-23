/**
 * Room contracts — isolated spaces where players interact during an exercise.
 *
 * Key design decisions:
 * - Every exercise starts with one default "Plenary" room. Multi-room is opt-in.
 * - In hybrid mode, each room has its own participation mode (digital or facilitator-led).
 * - Room-specific projections available via separate URLs.
 */

import type { UserId } from './user';
import type { RoomVideoConfig } from './video';

export type RoomId = string & { readonly __brand: 'RoomId' };

/**
 * Per-room participation mode. Only relevant when the exercise is in 'hybrid' mode.
 * In non-hybrid mode, all rooms inherit the exercise-level participationMode.
 */
export type RoomParticipationMode = 'digital' | 'facilitator_led';

export type Room = {
  id: RoomId;
  exerciseId: string;
  name: string;
  description: string;
  /** Hex color for room identification in UI (e.g., '#10b981'). */
  color: string;
  /** Code players use to join this room (e.g., 'SOC-7X3K'). */
  joinCode: string;
  playerIds: UserId[];
  /**
   * Per-room participation mode for hybrid exercises.
   * When exercise participationMode is 'digital' or 'facilitator_led', this is ignored.
   * When exercise participationMode is 'hybrid', this controls whether players in
   * this room use devices or the facilitator drives.
   */
  participationMode: RoomParticipationMode;
  /**
   * Whether this room is the default plenary room.
   * The first room created for an exercise is always the plenary.
   */
  isPlenary: boolean;
  /** Video conferencing configuration. Null = no video for this room. */
  videoConfig: RoomVideoConfig | null;
  /** Information asymmetry rules — controls what this room's players can see. */
  visibilityRules: VisibilityRules;
  createdAt: Date;
};

// ── Multi-Room Membership ────────────────────────────────────

/**
 * A player's membership in a room. Players can be in multiple rooms
 * within the same exercise (e.g., CISO monitoring SOC and Executive rooms).
 */
export type RoomPlayer = {
  roomId: RoomId;
  userId: UserId;
  exerciseId: string;
  /** The player's primary room — shown on login, used as default view. */
  isPrimaryRoom: boolean;
  /** Role name within this room (e.g., "SOC Analyst", "CISO"). */
  roleName: string;
  joinedAt: Date;
};

// ── Information Asymmetry ────────────────────────────────────

/**
 * Controls what players in a room can see. Set by the facilitator.
 * This is a first-class exercise mechanic — information asymmetry by design.
 *
 * A player in only one room has a partial picture. A multi-room player
 * becomes a natural coordination point, mirroring real incident command.
 */
export type VisibilityRules = {
  /** Can players in this room see that other rooms exist? */
  canSeeOtherRoomsExist: boolean;
  /** Which specific rooms are visible (names/activity). Empty = none visible. */
  visibleRoomIds: RoomId[];
  /** What documents this room can access. */
  documentScope: 'own_room' | 'specific_rooms' | 'all';
  /** If documentScope is 'specific_rooms', which rooms' docs are visible. */
  visibleDocumentRoomIds: RoomId[];
  /** What injects this room can see. */
  injectVisibility: 'targeted_only' | 'plenary_only' | 'all';
};

export type CreateRoomInput = {
  name: string;
  description: string;
  color: string;
  participationMode?: RoomParticipationMode; // defaults to 'digital'
};

export type UpdateRoomInput = {
  name?: string;
  description?: string;
  color?: string;
  participationMode?: RoomParticipationMode;
};
