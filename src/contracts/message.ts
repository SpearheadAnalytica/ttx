/**
 * Message contracts — all communication within rooms.
 * Messages are polymorphic: chat, RFI, inject delivery, system, and cross-room
 * are all Message records with different `type` values.
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

export type Message = {
  id: MessageId;
  exerciseId: string;
  roomId: RoomId;
  senderId: UserId;
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
