/**
 * Room contracts — isolated spaces where players interact during an exercise.
 */

import type { UserId } from './user';

export type RoomId = string & { readonly __brand: 'RoomId' };

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
  createdAt: Date;
};

export type CreateRoomInput = {
  name: string;
  description: string;
  color: string;
};

export type UpdateRoomInput = {
  name?: string;
  description?: string;
  color?: string;
};
