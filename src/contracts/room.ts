/**
 * Room contracts — isolated spaces where players interact during an exercise.
 *
 * Key design decisions:
 * - Every exercise starts with one default "Plenary" room. Multi-room is opt-in.
 * - In hybrid mode, each room has its own participation mode (digital or facilitator-led).
 * - Room-specific projections available via separate URLs.
 */

import type { UserId } from './user';

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
  createdAt: Date;
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
