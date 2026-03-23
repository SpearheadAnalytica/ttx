/**
 * Message contracts — all communication within rooms.
 *
 * Messages are polymorphic: chat, RFI, inject delivery, system, and cross-room
 * are all Message records with different `type` values.
 *
 * Key design decision: MESSAGES BELONG TO ROLES, NOT PEOPLE.
 * When the AAR shows "SOC Analyst said X at T+00:22," it doesn't matter which
 * person was playing that role. The role is the actor in the exercise narrative.
 * The audit log records both role and underlying user for accountability.
 */

import type { UserId } from './user';
import type { RoomId } from './room';

export type MessageId = string & { readonly __brand: 'MessageId' };

export type MessageType =
  | 'chat'
  | 'rfi_request'
  | 'rfi_response'
  | 'inject'
  | 'system'
  | 'cross_room';

export type RfiStatus = 'pending' | 'answered' | 'deferred' | 'redirected';

/**
 * Rich text content stored as Tiptap JSON (ProseMirror document structure).
 * Never store as plain HTML — always use the structured JSON format.
 */
export type RichTextContent = {
  type: 'doc';
  content: Record<string, unknown>[];
};

export type Attachment = {
  id: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  url: string;
  uploadedAt: Date;
};

export type MessageMetadata = {
  /** For RFI messages: links request to response. */
  rfiId: string | null;
  /** For RFI messages: current status. */
  rfiStatus: RfiStatus | null;
  /** For inject messages: which inject was delivered. */
  injectId: string | null;
  /** For cross-room messages: where it came from. */
  sourceRoomId: RoomId | null;
  /** For cross-room messages: where it was sent to. */
  targetRoomId: RoomId | null;
  /** For redirected RFIs: which room to redirect to. */
  redirectRoomId: RoomId | null;
};

/**
 * A message in the exercise.
 *
 * Attribution model:
 * - senderId: the actual User who sent the message (for audit/accountability)
 * - senderRoleName: the exercise role name displayed in the UI (e.g., "SOC Analyst")
 * - senderRoleTitle: optional title within the role (e.g., "Team Lead")
 *
 * The AAR and exercise narrative use senderRoleName. The audit log uses senderId.
 * If a role is transferred mid-exercise, messages keep the role name — only the
 * audit log shows which human was behind the role at that moment.
 */
export type Message = {
  id: MessageId;
  exerciseId: string;
  roomId: RoomId;
  /** The actual user who sent this message. For audit/accountability. */
  senderId: UserId;
  /** The role name displayed in the exercise (e.g., "SOC Analyst"). */
  senderRoleName: string;
  content: RichTextContent;
  attachments: Attachment[];
  type: MessageType;
  metadata: MessageMetadata;
  createdAt: Date;
};

export type SendMessageInput = {
  roomId: RoomId;
  content: RichTextContent;
  attachments?: Attachment[];
  type: MessageType;
  metadata?: Partial<MessageMetadata>;
};

export type SendRfiInput = {
  roomId: RoomId;
  content: RichTextContent;
};

export type RespondToRfiInput = {
  rfiMessageId: MessageId;
  content: RichTextContent;
  attachments?: Attachment[];
};

export type DeferRfiInput = {
  rfiMessageId: MessageId;
  reason: string;
};

export type RedirectRfiInput = {
  rfiMessageId: MessageId;
  targetRoomId: RoomId;
  note: string;
};
