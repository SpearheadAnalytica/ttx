/**
 * Communication contracts — cross-room messaging rules.
 * This is a core exercise mechanic: who can talk to whom, and how.
 */

import type { RoomId } from './room';
import type { RichTextContent } from './message';

export type CommunicationPreset = 'open' | 'hierarchical' | 'controlled' | 'custom';

/**
 * How a message routes between two rooms.
 * - 'direct':  players can message the target room freely
 * - 'routed':  message goes to White Cell; facilitator relays manually
 * - 'blocked': no communication path exists (target room not shown to sender)
 */
export type CommunicationMode = 'direct' | 'routed' | 'blocked';

/**
 * Adjacency map defining communication rules between rooms.
 * Key: source room ID. Value: map of target room ID → mode.
 *
 * Example:
 * {
 *   'room-soc': { 'room-exec': 'direct', 'room-legal': 'routed' },
 *   'room-exec': { 'room-soc': 'direct', 'room-legal': 'direct' },
 * }
 *
 * If a room pair is missing from the matrix, it defaults to 'blocked'.
 */
export type CommunicationMatrix = Record<string, Record<string, CommunicationMode>>;

/**
 * Request to change communication rules mid-exercise.
 * Can optionally include an inject message explaining the change narratively.
 */
export type CommunicationChangeInput = {
  /** Updated matrix entries. Merges with existing matrix. */
  matrixUpdates: CommunicationMatrix;
  /** If true, notify affected rooms with an inject. */
  notifyPlayers: boolean;
  /** Narrative inject content shown to affected rooms. */
  injectContent: RichTextContent | null;
};

/**
 * Builds the default communication matrix for a given preset.
 * For 'custom', returns an empty matrix (facilitator fills it in).
 */
export type BuildMatrixInput = {
  preset: CommunicationPreset;
  roomIds: RoomId[];
  /** For 'hierarchical': ordered list of room IDs defining the chain. */
  hierarchyOrder?: RoomId[];
};
