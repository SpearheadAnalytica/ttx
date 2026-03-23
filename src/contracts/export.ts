/**
 * Export wizard contracts — configurable data export from exercises.
 * Supports CSV and Excel formats with selectable data categories.
 * Export runs async; facilitator polls for completion then downloads.
 */

import type { ExerciseId } from './exercise';
import type { RoomId } from './room';

// ── Branded IDs ──────────────────────────────────────────────

export type ExportId = string & { readonly __brand: 'ExportId' };

// ── Export Categories ────────────────────────────────────────

/** Selectable data categories for export. Each becomes a sheet in Excel or a separate CSV. */
export type ExportCategory =
  | 'injects_delivered'
  | 'player_actions'
  | 'chat_transcripts'
  | 'facilitator_notes'
  | 'white_card_injects'
  | 'phase_transitions'
  | 'comms_restrictions'
  | 'attendance'
  | 'rfi_log'
  | 'dm_transcripts'
  | 'evaluator_ratings';

// ── Export Format ─────────────────────────────────────────────

export type ExportFormat = 'csv' | 'xlsx';

// ── Export Configuration ─────────────────────────────────────

export type ExportConfig = {
  exerciseId: ExerciseId;
  /** Which data categories to include. */
  categories: ExportCategory[];
  format: ExportFormat;
  /** Filter to specific rooms. Null = all rooms. */
  roomFilter: RoomId[] | null;
  /** Filter to a date/time range within the exercise. Null = entire exercise. */
  dateRange: { start: Date; end: Date } | null;
  /** For xlsx: one sheet per category. For csv: one file per category in a zip. */
  isSingleFile: boolean;
};

// ── Export Status ─────────────────────────────────────────────

export type ExportStatus = 'queued' | 'processing' | 'completed' | 'failed';

export type ExportResult = {
  id: ExportId;
  exerciseId: ExerciseId;
  config: ExportConfig;
  status: ExportStatus;
  /** Presigned download URL. Only set when status is 'completed'. */
  downloadUrl: string | null;
  /** Error message if status is 'failed'. */
  errorMessage: string | null;
  /** Number of rows/records exported per category. */
  rowCounts: Partial<Record<ExportCategory, number>>;
  createdAt: Date;
  completedAt: Date | null;
};
