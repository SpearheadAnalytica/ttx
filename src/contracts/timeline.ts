/**
 * Timeline contracts — the unified event log for an exercise.
 * Every significant action produces a timeline event. Used by facilitators,
 * evaluators, and observers, and forms the backbone of the AAR.
 */

import type { UserId } from './user';
import type { RoomId } from './room';

export type TimelineEventId = string & { readonly __brand: 'TimelineEventId' };

export type TimelineEventType =
  | 'inject_delivered'
  | 'inject_read'
  | 'rfi_sent'
  | 'rfi_answered'
  | 'rfi_deferred'
  | 'rfi_redirected'
  | 'phase_started'
  | 'phase_completed'
  | 'exercise_started'
  | 'exercise_paused'
  | 'exercise_resumed'
  | 'exercise_completed'
  | 'comm_rule_changed'
  | 'player_joined'
  | 'player_left'
  | 'decision_tagged'
  | 'cross_room_message';

export type TimelineEvent = {
  id: TimelineEventId;
  exerciseId: string;
  type: TimelineEventType;
  /** Room this event is associated with, if any. */
  roomId: RoomId | null;
  /** User who triggered this event, if any. */
  actorId: UserId | null;
  /** Human-readable summary (e.g., "SOC Lead sent RFI to White Cell"). */
  summary: string;
  /** Type-specific data. Structure depends on `type`. */
  metadata: Record<string, unknown>;
  createdAt: Date;
};
