/**
 * Direct messaging contracts — player-to-player private messages.
 * All DMs scoped to an exercise. Facilitator can enable/disable globally
 * or restrict specific players. Messages attributed to roles, not people.
 */

import type { UserId } from './user';
import type { ExerciseId } from './exercise';
import type { RichTextContent } from './message';

// ── Branded IDs ──────────────────────────────────────────────

export type DirectMessageId = string & { readonly __brand: 'DirectMessageId' };
export type DMThreadId = string & { readonly __brand: 'DMThreadId' };

// ── Direct Message ───────────────────────────────────────────

export type DirectMessage = {
  id: DirectMessageId;
  threadId: DMThreadId;
  exerciseId: ExerciseId;
  senderId: UserId;
  recipientId: UserId;
  /** Role name of sender at time of sending — for AAR attribution. */
  senderRoleName: string;
  content: RichTextContent;
  isRead: boolean;
  createdAt: Date;
  readAt: Date | null;
};

// ── Thread ───────────────────────────────────────────────────

export type DMThread = {
  id: DMThreadId;
  exerciseId: ExerciseId;
  /** The two participants in this DM thread. */
  participantIds: [UserId, UserId];
  /** Role names for display (e.g., "SOC Analyst" ↔ "CISO"). */
  participantRoleNames: [string, string];
  lastMessageAt: Date;
  /** Unread count for the requesting user. */
  unreadCount: number;
};

// ── Permissions ──────────────────────────────────────────────

/** Exercise-level DM permission settings, controlled by facilitator. */
export type DMPermissions = {
  /** Master toggle — when false, no DMs allowed in this exercise. */
  isEnabled: boolean;
  /** Players who are blocked from sending/receiving DMs. */
  restrictedPlayerIds: UserId[];
};

// ── Inputs ───────────────────────────────────────────────────

export type SendDMInput = {
  exerciseId: ExerciseId;
  recipientId: UserId;
  content: RichTextContent;
};
