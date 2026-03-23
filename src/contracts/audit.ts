/**
 * Audit logging contracts — immutable, append-only record of all state-changing actions.
 *
 * FedRAMP-ready: every state-changing action gets an audit entry. No deletes ever.
 * Entries record who did what, to which resource, when, and whether it succeeded.
 */

import type { UserId } from './user';
import type { ExerciseId } from './exercise';

export type AuditEntryId = string & { readonly __brand: 'AuditEntryId' };

/**
 * All auditable actions in the system. Covers every state-changing operation.
 */
export type AuditAction =
  // Exercise lifecycle
  | 'exercise.create'
  | 'exercise.update'
  | 'exercise.delete'
  | 'exercise.start'
  | 'exercise.pause'
  | 'exercise.resume'
  | 'exercise.complete'
  // Staff management
  | 'staff.add'
  | 'staff.remove'
  | 'staff.update_flags'
  | 'staff.transfer_ownership'
  | 'staff.set_observer_config'
  // Room management
  | 'room.create'
  | 'room.update'
  | 'room.delete'
  | 'room.add_player'
  | 'room.remove_player'
  // Messaging
  | 'message.send'
  | 'message.send_cross_room'
  // RFI
  | 'rfi.submit'
  | 'rfi.respond'
  | 'rfi.defer'
  | 'rfi.redirect'
  // Injects & Phases
  | 'inject.create'
  | 'inject.update'
  | 'inject.delete'
  | 'inject.deliver'
  | 'phase.create'
  | 'phase.advance'
  // Communication
  | 'communication.change_preset'
  | 'communication.update_matrix'
  // Evaluator
  | 'note.create'
  | 'note.update'
  | 'note.delete'
  // AAR
  | 'aar.generate'
  | 'aar.update'
  | 'aar.export'
  // Auth
  | 'auth.login'
  | 'auth.logout'
  | 'auth.session_timeout';

/**
 * Target resource types for audit entries.
 */
export type AuditTargetType =
  | 'exercise'
  | 'room'
  | 'message'
  | 'inject'
  | 'phase'
  | 'user'
  | 'note'
  | 'aar'
  | 'communication_matrix'
  | 'observer_config';

/**
 * A single audit log entry. Immutable once created — no updates, no deletes.
 */
export type AuditEntry = {
  id: AuditEntryId;
  timestamp: Date;
  /** The user who performed the action. Null for system-initiated actions. */
  actorId: UserId | null;
  action: AuditAction;
  targetType: AuditTargetType;
  targetId: string;
  result: 'success' | 'failure';
  /** Action-specific details (e.g., what changed, error message on failure). */
  metadata: Record<string, unknown>;
  /** Exercise scope. Null for system-level actions (login, logout). */
  exerciseId: ExerciseId | null;
};

/** Input for recording an audit entry. */
export type RecordAuditInput = {
  actorId: UserId | null;
  action: AuditAction;
  targetType: AuditTargetType;
  targetId: string;
  result: 'success' | 'failure';
  metadata?: Record<string, unknown>;
  exerciseId?: ExerciseId;
};

/** Filters for querying the audit log. */
export type AuditLogFilters = {
  exerciseId?: ExerciseId;
  actorId?: UserId;
  action?: AuditAction;
  targetType?: AuditTargetType;
  result?: 'success' | 'failure';
  /** Only entries after this timestamp. */
  after?: Date;
  /** Only entries before this timestamp. */
  before?: Date;
  limit?: number;
};
