/**
 * Socket.io event contracts — all real-time events between client and server.
 * These types are shared by both sides to ensure the wire protocol stays in sync.
 */

import type { UserId } from './user';
import type { RoomId } from './room';
import type { Message, SendMessageInput, RfiStatus } from './message';
import type { Inject } from './inject';
import type { EvaluatorNote, CreateNoteInput } from './evaluator';
import type { CommunicationMatrix } from './communication';
import type { TimelineEvent } from './timeline';

/** Events the client can emit to the server. */
export type ClientToServerEvents = {
  /** Player/facilitator sends a message to a room. */
  'message:send': (input: SendMessageInput, callback: (result: { ok: true; message: Message } | { ok: false; error: string }) => void) => void;

  /** Player submits an RFI to White Cell. */
  'rfi:submit': (input: { roomId: RoomId; content: Message['content'] }, callback: (result: { ok: true; rfiId: string } | { ok: false; error: string }) => void) => void;

  /** Facilitator responds to an RFI. */
  'rfi:respond': (input: { rfiId: string; content: Message['content'] }, callback: (result: { ok: true } | { ok: false; error: string }) => void) => void;

  /** Facilitator defers an RFI. */
  'rfi:defer': (input: { rfiId: string; reason: string }, callback: (result: { ok: true } | { ok: false; error: string }) => void) => void;

  /** Facilitator manually delivers an inject. */
  'inject:trigger': (input: { injectId: string }, callback: (result: { ok: true } | { ok: false; error: string }) => void) => void;

  /** Facilitator changes exercise phase. */
  'phase:advance': (callback: (result: { ok: true; phaseId: string } | { ok: false; error: string }) => void) => void;

  /** Facilitator updates communication rules mid-exercise. */
  'comm:update': (input: { matrix: CommunicationMatrix; notifyPlayers: boolean; injectContent: Message['content'] | null }, callback: (result: { ok: true } | { ok: false; error: string }) => void) => void;

  /** Evaluator saves a note. */
  'note:create': (input: CreateNoteInput, callback: (result: { ok: true; note: EvaluatorNote } | { ok: false; error: string }) => void) => void;

  /** Typing indicators. */
  'typing:start': (input: { roomId: RoomId }) => void;
  'typing:stop': (input: { roomId: RoomId }) => void;

  /** Client joins a room on connect. */
  'room:join': (input: { exerciseId: string; roomId?: RoomId }, callback: (result: { ok: true } | { ok: false; error: string }) => void) => void;
};

/** Events the server can emit to clients. */
export type ServerToClientEvents = {
  /** New message in a room. */
  'message:new': (message: Message) => void;

  /** Inject delivered to a room. */
  'inject:delivered': (inject: Inject) => void;

  /** RFI status update (answered, deferred, redirected). */
  'rfi:update': (update: { rfiId: string; status: RfiStatus; responseMessage: Message | null }) => void;

  /** Exercise phase changed. */
  'phase:changed': (update: { phaseId: string; phaseName: string }) => void;

  /** Communication rules changed. */
  'comm:changed': (update: { matrix: CommunicationMatrix }) => void;

  /** New timeline event. */
  'timeline:event': (event: TimelineEvent) => void;

  /** Someone is typing. */
  'typing:active': (update: { roomId: RoomId; userId: UserId; displayName: string }) => void;

  /** Someone stopped typing. */
  'typing:inactive': (update: { roomId: RoomId; userId: UserId }) => void;

  /** Exercise status change (paused, resumed, completed). */
  'exercise:status': (update: { status: 'active' | 'paused' | 'completed' }) => void;

  /** Error broadcast. */
  'error': (error: { code: string; message: string }) => void;
};
