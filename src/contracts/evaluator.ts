/**
 * Evaluator contracts — note-taking, tagging, and rating during exercises.
 * Evaluators are the primary producers of After Action Report data.
 */

import type { UserId } from './user';
import type { RoomId } from './room';
import type { MessageId, RichTextContent } from './message';

export type NoteId = string & { readonly __brand: 'NoteId' };

/**
 * Quick-tags for one-click annotation of observations.
 * Displayed as buttons in the evaluator UI.
 */
export type QuickTag =
  | 'good_decision'
  | 'gap_identified'
  | 'escalation'
  | 'meeting_called'
  | 'delay'
  | 'creative_solution'
  | 'missed_step'
  | 'good_coordination'
  | 'communication_breakdown'
  | 'process_followed'
  | 'process_skipped';

export const QUICK_TAG_LABELS: Record<QuickTag, string> = {
  good_decision: 'Good Decision',
  gap_identified: 'Gap Identified',
  escalation: 'Escalation',
  meeting_called: 'Meeting Called',
  delay: 'Delay',
  creative_solution: 'Creative Solution',
  missed_step: 'Missed Step',
  good_coordination: 'Good Coordination',
  communication_breakdown: 'Communication Breakdown',
  process_followed: 'Process Followed',
  process_skipped: 'Process Skipped',
};

export const QUICK_TAG_ICONS: Record<QuickTag, string> = {
  good_decision: '🎯',
  gap_identified: '⚠️',
  escalation: '🔄',
  meeting_called: '📞',
  delay: '⏱️',
  creative_solution: '💡',
  missed_step: '❌',
  good_coordination: '🤝',
  communication_breakdown: '📡',
  process_followed: '✅',
  process_skipped: '⏭️',
};

/** Rating scale for evaluator assessments. 1 = needs work, 5 = excellent. */
export type Rating = 1 | 2 | 3 | 4 | 5;

export type EvaluatorNote = {
  id: NoteId;
  exerciseId: string;
  evaluatorId: UserId;
  /** Which room this note is about. */
  roomId: RoomId;
  content: RichTextContent;
  tags: QuickTag[];
  rating: Rating | null;
  /** Optional link to the specific message that prompted this note. */
  linkedMessageId: MessageId | null;
  createdAt: Date;
  updatedAt: Date;
};

export type CreateNoteInput = {
  roomId: RoomId;
  content: RichTextContent;
  tags?: QuickTag[];
  rating?: Rating;
  linkedMessageId?: MessageId;
};

export type UpdateNoteInput = {
  content?: RichTextContent;
  tags?: QuickTag[];
  rating?: Rating;
};

/**
 * Summary of evaluator notes for AAR generation.
 * Grouped by room and tag for structured review.
 */
export type NoteSummary = {
  exerciseId: string;
  evaluatorId: UserId;
  totalNotes: number;
  notesByRoom: Record<string, number>;
  notesByTag: Record<QuickTag, number>;
  averageRating: number | null;
};
