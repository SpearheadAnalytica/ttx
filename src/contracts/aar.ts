/**
 * After Action Report contracts — AI-drafted analysis from exercise data.
 *
 * The AAR is the capstone deliverable. An AI agent ingests all exercise data
 * (timeline, messages, evaluator notes, inject responses, communication patterns)
 * and produces a structured draft report. Facilitators review and edit before
 * publishing.
 *
 * Flow: Exercise completes → facilitator clicks "Generate AAR" → AI agent
 * processes all data → draft appears in editor → facilitator edits → publish/export.
 */

import type { UserId } from './user';
import type { ExerciseId } from './exercise';
import type { RoomId } from './room';
import type { RichTextContent } from './message';
import type { QuickTag } from './evaluator';

export type AarId = string & { readonly __brand: 'AarId' };

export type AarStatus = 'generating' | 'draft' | 'review' | 'published';

/**
 * The full After Action Report document.
 * Sections are ordered and individually editable.
 */
export type Aar = {
  id: AarId;
  exerciseId: ExerciseId;
  status: AarStatus;
  /** Who triggered the generation. */
  generatedBy: UserId;
  /** Who last edited the report. */
  lastEditedBy: UserId | null;
  /** Top-level executive summary (AI-generated, editable). */
  executiveSummary: RichTextContent;
  /** Ordered report sections. */
  sections: AarSection[];
  /** Overall exercise metrics. */
  metrics: AarMetrics;
  /** Per-room analysis. */
  roomAnalyses: AarRoomAnalysis[];
  /** Key findings distilled from evaluator notes and AI analysis. */
  findings: AarFinding[];
  /** Prioritized recommendations. */
  recommendations: AarRecommendation[];
  generatedAt: Date;
  publishedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

/**
 * A section of the AAR. Each is AI-generated with a specific focus,
 * then editable by the facilitator in the rich text editor.
 */
export type AarSection = {
  id: string;
  title: string;
  order: number;
  content: RichTextContent;
  /** Section type drives what data the AI agent focuses on. */
  type: AarSectionType;
  /** Whether the facilitator has reviewed/approved this section. */
  isReviewed: boolean;
};

export type AarSectionType =
  | 'executive_summary'
  | 'exercise_overview'      // Scenario description, objectives, participants
  | 'timeline_narrative'      // Chronological story of what happened
  | 'phase_analysis'          // Per-phase breakdown
  | 'communication_analysis'  // Cross-room patterns, bottlenecks
  | 'decision_analysis'       // Key decisions and their outcomes
  | 'gap_analysis'            // Identified weaknesses and missed steps
  | 'strengths'               // What went well
  | 'recommendations'         // Prioritized action items
  | 'appendix';               // Raw data, supporting evidence

/**
 * Quantitative metrics computed from exercise data.
 * Displayed as cards/charts in the AAR and fed to the AI agent as context.
 */
export type AarMetrics = {
  /** Total exercise duration in seconds. */
  totalDurationSeconds: number;
  /** Per-phase duration in seconds. */
  phaseDurations: Array<{ phaseId: string; phaseName: string; durationSeconds: number }>;
  /** Total messages sent across all rooms. */
  totalMessages: number;
  /** Messages per room. */
  messagesPerRoom: Array<{ roomId: string; roomName: string; count: number }>;
  /** RFI statistics. */
  rfiStats: {
    total: number;
    answered: number;
    deferred: number;
    redirected: number;
    /** Average time to answer in seconds. */
    averageResponseTimeSeconds: number;
    /** Longest wait time in seconds. */
    maxResponseTimeSeconds: number;
  };
  /** Inject delivery and read rates. */
  injectStats: {
    total: number;
    delivered: number;
    read: number;
    /** Average time from delivery to first room response (seconds). */
    averageReactionTimeSeconds: number;
  };
  /** Cross-room message count. */
  crossRoomMessages: number;
  /** Evaluator note counts by tag. */
  notesByTag: Record<string, number>;
  /** Average evaluator rating (1-5). */
  averageRating: number | null;
  /** Number of participants by role. */
  participantCounts: Record<string, number>;
};

/**
 * Per-room analysis produced by the AI agent.
 * Each room gets its own assessment based on messages, inject responses,
 * evaluator notes, and communication patterns.
 */
export type AarRoomAnalysis = {
  roomId: RoomId;
  roomName: string;
  /** AI-generated narrative of what this room did during the exercise. */
  narrative: RichTextContent;
  /** Room-specific metrics. */
  metrics: {
    messageCount: number;
    rfisSent: number;
    rfisReceived: number;
    averageInjectReactionSeconds: number;
    evaluatorRating: number | null;
  };
  /** Key moments identified by the AI agent. */
  keyMoments: Array<{
    timestamp: Date;
    description: string;
    sentiment: 'positive' | 'neutral' | 'negative';
    linkedEventIds: string[];
  }>;
  /** Tags from evaluator notes for this room. */
  tagSummary: Record<QuickTag, number>;
};

/**
 * A key finding — synthesized from evaluator notes, AI analysis, or both.
 * Findings are the core insight layer between raw data and recommendations.
 */
export type AarFinding = {
  id: string;
  /** Short title (e.g., "Delayed escalation to executive team"). */
  title: string;
  description: RichTextContent;
  severity: 'critical' | 'high' | 'medium' | 'low';
  /** Which rooms this finding relates to. */
  relatedRoomIds: RoomId[];
  /** Evaluator note IDs that support this finding. */
  supportingNoteIds: string[];
  /** Timeline event IDs that support this finding. */
  supportingEventIds: string[];
  /** Source: AI-identified, evaluator-tagged, or both. */
  source: 'ai' | 'evaluator' | 'combined';
};

/**
 * A prioritized recommendation — the actionable output of the AAR.
 * Each recommendation links back to its supporting findings.
 */
export type AarRecommendation = {
  id: string;
  title: string;
  description: RichTextContent;
  priority: 'immediate' | 'short_term' | 'long_term';
  /** Finding IDs this recommendation addresses. */
  addressesFindings: string[];
  /** Optional: who should own this action item. */
  assignee: string | null;
};

// ─── AI Agent Interface ──────────────────────────────────────

/**
 * Input to the AI agent for AAR generation.
 * We bundle all exercise data into a single payload so the agent
 * has complete context in one shot.
 */
export type AarGenerationInput = {
  exerciseId: ExerciseId;
  /** Exercise metadata. */
  exerciseTitle: string;
  exerciseDescription: string;
  /** Complete timeline, ordered chronologically. */
  timeline: Array<{
    timestamp: Date;
    type: string;
    summary: string;
    roomName: string | null;
    actorName: string | null;
    metadata: Record<string, unknown>;
  }>;
  /** All messages grouped by room. */
  messagesByRoom: Record<string, Array<{
    timestamp: Date;
    senderName: string;
    senderRole: string;
    content: string;  // Plain text extracted from RichTextContent
    type: string;
    rfiStatus: string | null;
  }>>;
  /** All evaluator notes grouped by room. */
  notesByRoom: Record<string, Array<{
    evaluatorName: string;
    content: string;  // Plain text
    tags: QuickTag[];
    rating: number | null;
    timestamp: Date;
  }>>;
  /** Phases with their injects. */
  phases: Array<{
    name: string;
    durationSeconds: number;
    injects: Array<{
      title: string;
      type: string;
      targetRoomName: string;
      deliveredAt: Date | null;
      content: string;  // Plain text
    }>;
  }>;
  /** Communication rule changes during the exercise. */
  communicationChanges: Array<{
    timestamp: Date;
    description: string;
    affectedRooms: string[];
  }>;
  /** Pre-computed metrics. */
  metrics: AarMetrics;
};

/**
 * Output from the AI agent. Structured so we can directly populate
 * the AAR document without additional parsing.
 */
export type AarGenerationOutput = {
  executiveSummary: string;  // Markdown, converted to RichTextContent
  sections: Array<{
    type: AarSectionType;
    title: string;
    content: string;  // Markdown
  }>;
  roomAnalyses: Array<{
    roomId: string;
    narrative: string;  // Markdown
    keyMoments: Array<{
      timestamp: string;  // ISO string
      description: string;
      sentiment: 'positive' | 'neutral' | 'negative';
    }>;
  }>;
  findings: Array<{
    title: string;
    description: string;  // Markdown
    severity: 'critical' | 'high' | 'medium' | 'low';
    relatedRoomNames: string[];
    source: 'ai' | 'evaluator' | 'combined';
  }>;
  recommendations: Array<{
    title: string;
    description: string;  // Markdown
    priority: 'immediate' | 'short_term' | 'long_term';
    addressesFindings: string[];  // Finding titles
  }>;
};

/**
 * Streaming progress events during AAR generation.
 * UI shows a progress indicator as each section completes.
 */
export type AarGenerationProgress = {
  stage: 'collecting_data' | 'analyzing_timeline' | 'analyzing_rooms' | 'generating_findings' | 'generating_recommendations' | 'generating_sections' | 'finalizing';
  /** 0-100 */
  percentComplete: number;
  /** Currently processing section, if applicable. */
  currentSection: string | null;
};

// ─── Export Formats ──────────────────────────────────────────

export type AarExportFormat = 'pdf' | 'html' | 'markdown' | 'json';

export type AarExportInput = {
  aarId: AarId;
  format: AarExportFormat;
  /** Which sections to include. Empty = all. */
  includeSections: AarSectionType[];
  /** Whether to include raw metrics data. */
  includeMetrics: boolean;
  /** Whether to include the visual reconstruction. */
  includeReconstruction: boolean;
};
