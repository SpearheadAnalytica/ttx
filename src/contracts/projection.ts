/**
 * Master Projection contracts — the CNN-style situation display shown on a projector.
 *
 * The projection is a light-mode, high-contrast, read-only view that shows:
 * - Exercise clock and current phase
 * - Plenary injects (exercise-wide, not room-specific)
 * - Exercise status
 *
 * It does NOT show: room-specific injects, facilitator controls, chat,
 * evaluator/observer notes, or any admin UI.
 *
 * The facilitator pops it out as a separate browser window/tab to throw on a screen.
 * Route: /exercises/[id]/project
 */

import type { ExerciseId, ExerciseStatus } from './exercise';
import type { Inject } from './inject';

/**
 * Configuration for the master projection display.
 */
export type ProjectionConfig = {
  /** Show the exercise clock on the projection. */
  showClock: boolean;
  /** Show the current phase name and progress. */
  showPhase: boolean;
  /** Optional background image URL (e.g., scenario map, org chart). */
  customBackgroundUrl: string | null;
};

/** Default projection config. */
export const DEFAULT_PROJECTION_CONFIG: ProjectionConfig = {
  showClock: true,
  showPhase: true,
  customBackgroundUrl: null,
};

/**
 * The full state needed to render the master projection.
 * Pushed to clients via socket events.
 */
export type ProjectionState = {
  exerciseId: ExerciseId;
  exerciseTitle: string;
  status: ExerciseStatus;
  /** Current phase name. Null if exercise hasn't started. */
  currentPhaseName: string | null;
  /** Seconds elapsed since exercise started. Null if not started. */
  exerciseClockSeconds: number | null;
  /** Seconds elapsed in current phase. Null if not started. */
  phaseClockSeconds: number | null;
  /** Plenary injects that have been delivered (exercise-wide, not room-specific). */
  plenaryInjects: ProjectionInject[];
  config: ProjectionConfig;
};

/**
 * Simplified inject representation for the projection.
 * Only includes what's needed for display — no facilitator metadata.
 */
export type ProjectionInject = {
  id: string;
  title: string;
  /** Plain text summary for projection display (not full rich text). */
  summary: string;
  deliveredAt: Date;
};
