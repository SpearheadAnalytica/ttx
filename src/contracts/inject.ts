/**
 * Inject & Phase contracts — the scenario engine.
 * Phases structure the exercise timeline. Injects are events delivered to rooms.
 */

import type { RoomId } from './room';
import type { RichTextContent, Attachment } from './message';

export type PhaseId = string & { readonly __brand: 'PhaseId' };
export type InjectId = string & { readonly __brand: 'InjectId' };

export type Phase = {
  id: PhaseId;
  exerciseId: string;
  name: string;
  description: string;
  /** Order within the exercise (0-indexed). */
  order: number;
  /** Planned duration in minutes. Facilitator can override at runtime. */
  durationMinutes: number;
  injects: Inject[];
  startedAt: Date | null;
  completedAt: Date | null;
};

export type InjectType =
  | 'narrative'        // Story/context information
  | 'question'         // Requires a response from the room
  | 'data'             // Technical data (logs, alerts, reports)
  | 'communication_change';  // Changes communication rules mid-exercise

export type InjectDeliveryMethod = 'auto' | 'manual';

export type InjectStatus = 'pending' | 'delivered' | 'read';

export type Inject = {
  id: InjectId;
  phaseId: PhaseId;
  exerciseId: string;
  title: string;
  content: RichTextContent;
  type: InjectType;
  /** Which room receives this inject. */
  targetRoomId: RoomId;
  /** Seconds after phase start to auto-deliver. Ignored if deliveryMethod is 'manual'. */
  delayFromPhaseStart: number;
  deliveryMethod: InjectDeliveryMethod;
  attachments: Attachment[];
  status: InjectStatus;
  deliveredAt: Date | null;
  readAt: Date | null;
  createdAt: Date;
};

export type CreateInjectInput = {
  phaseId: PhaseId;
  title: string;
  content: RichTextContent;
  type: InjectType;
  targetRoomId: RoomId;
  delayFromPhaseStart: number;
  deliveryMethod: InjectDeliveryMethod;
  attachments?: Attachment[];
};

export type CreatePhaseInput = {
  name: string;
  description: string;
  order: number;
  durationMinutes: number;
};
