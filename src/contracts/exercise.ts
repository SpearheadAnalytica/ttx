/**
 * Exercise contracts — the top-level entity that owns rooms, phases, and staff.
 */

import type { UserId } from './user';
import type { CommunicationPreset, CommunicationMatrix } from './communication';
import type { Room } from './room';
import type { Phase } from './inject';

export type ExerciseId = string & { readonly __brand: 'ExerciseId' };

export type ExerciseStatus = 'draft' | 'active' | 'paused' | 'completed';

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

export type EvaluatorAssignment = {
  userId: UserId;
  /** Room IDs this evaluator is assigned to. Empty array = all rooms. */
  assignedRoomIds: string[];
};

export type ExerciseStaff = {
  facilitatorIds: UserId[];
  evaluators: EvaluatorAssignment[];
  observerConfig: ObserverConfig;
};

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
  startedAt: Date | null;
  pausedAt: Date | null;
  completedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

/** Shape for creating a new exercise. */
export type CreateExerciseInput = {
  title: string;
  description: string;
};

/** Shape for updating exercise settings. */
export type UpdateExerciseInput = {
  title?: string;
  description?: string;
  communicationPreset?: CommunicationPreset;
  communicationMatrix?: CommunicationMatrix;
};
