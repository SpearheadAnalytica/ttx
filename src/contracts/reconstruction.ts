/**
 * Exercise Reconstruction contracts — interactive visual replay and analysis.
 *
 * The reconstruction is a Sankey-style flow diagram + interactive timeline
 * that shows how information, decisions, and communication flowed through
 * the exercise. It's an analysis tool, not just a pretty picture.
 *
 * Facilitators and evaluators use it to:
 * - Replay the exercise at adjustable speed
 * - See communication patterns (who talked to whom, when, how much)
 * - Identify bottlenecks (slow RFI responses, delayed escalations)
 * - Correlate injects with room reactions
 * - Drill down into any moment to see the messages/notes
 * - Export annotated screenshots for the AAR
 *
 * Rendering: D3.js for the flow diagram, custom React components for
 * the interactive timeline and detail panels.
 */

import type { UserId } from './user';
import type { RoomId } from './room';
import type { ExerciseId } from './exercise';
import type { MessageId, MessageType, RfiStatus } from './message';
import type { InjectId, PhaseId } from './inject';
import type { TimelineEventType } from './timeline';
import type { QuickTag } from './evaluator';

// ═══════════════════════════════════════════════════════════════
// RECONSTRUCTION DATA MODEL
// ═══════════════════════════════════════════════════════════════

/**
 * The complete dataset needed to render the reconstruction.
 * Fetched once when the page loads, then filtered/animated client-side.
 */
export type ReconstructionData = {
  exerciseId: ExerciseId;
  /** Total duration in seconds. */
  totalDurationSeconds: number;
  /** Phase boundaries for the timeline ruler. */
  phases: ReconstructionPhase[];
  /** All rooms with their positions in the flow diagram. */
  rooms: ReconstructionRoom[];
  /** Every event, ordered chronologically. Drives the animation. */
  events: ReconstructionEvent[];
  /** Communication edges between rooms (changes over time). */
  communicationSnapshots: CommunicationSnapshot[];
};

export type ReconstructionPhase = {
  phaseId: PhaseId;
  name: string;
  /** Seconds from exercise start. */
  startOffset: number;
  /** Seconds from exercise start. */
  endOffset: number;
  injectCount: number;
};

export type ReconstructionRoom = {
  roomId: RoomId;
  name: string;
  color: string;
  playerCount: number;
  /** Position hint for the flow layout (set by facilitator or auto-arranged). */
  layoutPosition: { x: number; y: number } | null;
};

/**
 * A single event in the reconstruction timeline.
 * Events are the atoms of the replay — each one potentially
 * triggers a visual change (new edge, node highlight, inject marker).
 */
export type ReconstructionEvent = {
  id: string;
  /** Seconds from exercise start. */
  offsetSeconds: number;
  type: TimelineEventType;
  /** Source room (who initiated). */
  sourceRoomId: RoomId | null;
  /** Target room (who received). */
  targetRoomId: RoomId | null;
  /** Actor who triggered this event. */
  actorId: UserId | null;
  actorName: string | null;
  /** Short label for the visual (e.g., "RFI sent", "Inject: Server logs"). */
  label: string;
  /** Linked message ID for drill-down. */
  messageId: MessageId | null;
  /** Linked inject ID for drill-down. */
  injectId: InjectId | null;
  /** Visual properties. */
  visual: EventVisual;
};

/**
 * How an event renders in the diagram.
 * Separated from data so the rendering layer can be swapped.
 */
export type EventVisual = {
  /** What kind of visual element this event creates. */
  shape: 'edge' | 'node_pulse' | 'inject_marker' | 'phase_marker' | 'annotation';
  /** Edge color / node highlight color. */
  color: string;
  /** For edges: thickness represents volume/importance. 1-5 scale. */
  weight: number;
  /** Whether this event should be highlighted in the default view. */
  isKeyMoment: boolean;
  /** Icon identifier for the event type. */
  icon: string;
};

/**
 * Snapshot of the communication matrix at a point in time.
 * Used to animate edge appearance/disappearance when rules change mid-exercise.
 */
export type CommunicationSnapshot = {
  /** Seconds from exercise start when these rules took effect. */
  offsetSeconds: number;
  /** Edges that exist at this point. */
  edges: Array<{
    fromRoomId: RoomId;
    toRoomId: RoomId;
    mode: 'direct' | 'routed';
  }>;
};

// ═══════════════════════════════════════════════════════════════
// PLAYBACK CONTROLS
// ═══════════════════════════════════════════════════════════════

/**
 * State of the reconstruction playback.
 * The reconstruction can be played like a video: play, pause, scrub, speed.
 */
export type PlaybackState = {
  /** Current position in seconds from exercise start. */
  currentOffset: number;
  /** Whether the replay is actively playing. */
  isPlaying: boolean;
  /** Playback speed multiplier: 1x, 2x, 5x, 10x, 30x. */
  speed: PlaybackSpeed;
  /** Range of the timeline being viewed (for zoom). */
  viewRange: { start: number; end: number };
};

export type PlaybackSpeed = 1 | 2 | 5 | 10 | 30;

export type PlaybackAction =
  | { type: 'play' }
  | { type: 'pause' }
  | { type: 'seek'; offsetSeconds: number }
  | { type: 'setSpeed'; speed: PlaybackSpeed }
  | { type: 'zoomIn' }
  | { type: 'zoomOut' }
  | { type: 'zoomToPhase'; phaseId: PhaseId }
  | { type: 'zoomToRange'; start: number; end: number }
  | { type: 'resetZoom' };

// ═══════════════════════════════════════════════════════════════
// ANALYSIS TOOLS
// ═══════════════════════════════════════════════════════════════

/**
 * Filters for the reconstruction view.
 * Users can toggle event types, rooms, and time ranges to focus analysis.
 */
export type ReconstructionFilters = {
  /** Show only these event types. Empty = all. */
  eventTypes: TimelineEventType[];
  /** Show only events involving these rooms. Empty = all. */
  roomIds: RoomId[];
  /** Show only events from these phases. Empty = all. */
  phaseIds: PhaseId[];
  /** Show only events with these evaluator tags. Empty = all. */
  evaluatorTags: QuickTag[];
  /** Show only key moments (events flagged as significant). */
  keyMomentsOnly: boolean;
  /** Show only RFI-related events. */
  rfisOnly: boolean;
  /** Show only cross-room communication events. */
  crossRoomOnly: boolean;
};

/**
 * Computed analysis overlays — derived from the event data.
 * These are toggle-able layers on top of the base flow diagram.
 */
export type AnalysisOverlay =
  | 'response_time_heatmap'    // Color rooms by avg inject response time (green=fast, red=slow)
  | 'communication_volume'      // Edge thickness = message count between rooms
  | 'rfi_flow'                  // Highlight all RFI paths with status color coding
  | 'decision_points'           // Highlight evaluator-tagged decision moments
  | 'bottleneck_detection'      // AI-identified bottlenecks (slow responses, queued RFIs)
  | 'activity_heatmap';         // Room brightness = message rate over time

/**
 * Data for a specific analysis overlay.
 * Computed server-side or on-demand client-side.
 */
export type OverlayData = {
  overlay: AnalysisOverlay;
  /** Per-room values for heatmap overlays. */
  roomValues: Record<string, { value: number; label: string; color: string }>;
  /** Per-edge values for flow overlays. */
  edgeValues: Record<string, { value: number; label: string; thickness: number }>;
  /** Summary stat shown in the overlay legend. */
  summary: string;
};

// ═══════════════════════════════════════════════════════════════
// DRILL-DOWN / DETAIL PANEL
// ═══════════════════════════════════════════════════════════════

/**
 * When a user clicks on an event, edge, or room in the reconstruction,
 * a detail panel opens with contextual information.
 */
export type DrillDownTarget =
  | { type: 'event'; eventId: string }
  | { type: 'room'; roomId: RoomId; atOffset: number }
  | { type: 'edge'; fromRoomId: RoomId; toRoomId: RoomId; atOffset: number }
  | { type: 'phase'; phaseId: PhaseId }
  | { type: 'inject'; injectId: InjectId };

/**
 * Detail panel content — varies by what was clicked.
 */
export type DrillDownContent = {
  target: DrillDownTarget;
  title: string;
  /** Messages around this moment (±30 seconds). */
  nearbyMessages: Array<{
    id: MessageId;
    senderName: string;
    contentPreview: string;
    type: MessageType;
    timestamp: Date;
  }>;
  /** Evaluator notes about this moment. */
  relatedNotes: Array<{
    evaluatorName: string;
    contentPreview: string;
    tags: QuickTag[];
    rating: number | null;
  }>;
  /** Metrics specific to this drill-down target. */
  metrics: Record<string, { label: string; value: string }>;
};

// ═══════════════════════════════════════════════════════════════
// ANNOTATIONS
// ═══════════════════════════════════════════════════════════════

/**
 * Facilitators can add annotations to the reconstruction for the AAR.
 * Annotations pin to a specific moment and appear as callout bubbles.
 */
export type ReconstructionAnnotation = {
  id: string;
  exerciseId: ExerciseId;
  authorId: UserId;
  /** Seconds from exercise start where the annotation is pinned. */
  offsetSeconds: number;
  /** Which room this annotation is near (for positioning). Null = global. */
  roomId: RoomId | null;
  /** Annotation text (plain text, short). */
  text: string;
  /** Color/category of the annotation. */
  category: 'insight' | 'issue' | 'highlight' | 'question';
  createdAt: Date;
};

export type CreateAnnotationInput = {
  offsetSeconds: number;
  roomId: RoomId | null;
  text: string;
  category: ReconstructionAnnotation['category'];
};

// ═══════════════════════════════════════════════════════════════
// EXPORT / SCREENSHOT
// ═══════════════════════════════════════════════════════════════

/**
 * Export a snapshot of the reconstruction at a specific moment.
 * Used for embedding analysis screenshots in the AAR.
 */
export type ReconstructionExportInput = {
  exerciseId: ExerciseId;
  /** Moment to capture. */
  offsetSeconds: number;
  /** Which overlays are active. */
  activeOverlays: AnalysisOverlay[];
  /** Include annotations in the export. */
  includeAnnotations: boolean;
  /** Export format. */
  format: 'png' | 'svg';
  /** Resolution for PNG. */
  width: number;
  height: number;
};
