/**
 * Video conferencing contracts — Jitsi integration for room-level audio/video.
 * Self-hosted Jitsi for FedRAMP compliance. Each room gets its own meeting.
 * Facilitator controls comms by creating/destroying meetings per room.
 */

import type { UserId } from './user';
import type { RoomId } from './room';
import type { ExerciseId } from './exercise';

// ── Branded IDs ──────────────────────────────────────────────

export type MeetingId = string & { readonly __brand: 'MeetingId' };

// ── Jitsi Configuration ──────────────────────────────────────

/** Per-deployment Jitsi server configuration. */
export type JitsiConfig = {
  /** Base URL of the self-hosted Jitsi instance. */
  serverUrl: string;
  /** Prefix for room names to namespace meetings. */
  roomPrefix: string;
  /** JWT settings for authenticated Jitsi access. */
  jwt: {
    /** App ID registered with Jitsi. */
    appId: string;
    /** Secret for signing JWTs (server-side only, never sent to client). */
    secret: string;
  };
};

/** Per-room video configuration. */
export type RoomVideoConfig = {
  isVideoEnabled: boolean;
  /** Override deployment-level config for this room. Null = use deployment default. */
  jitsiConfigOverride: Partial<JitsiConfig> | null;
};

// ── Participant Video State ──────────────────────────────────

export type VideoParticipant = {
  userId: UserId;
  meetingId: MeetingId;
  isMuted: boolean;
  isCameraOn: boolean;
  isScreenSharing: boolean;
  isHandRaised: boolean;
  joinedAt: Date;
};

// ── Meeting State ────────────────────────────────────────────

export type VideoMeetingState = {
  meetingId: MeetingId;
  roomId: RoomId;
  exerciseId: ExerciseId;
  isActive: boolean;
  participants: VideoParticipant[];
  createdAt: Date;
  destroyedAt: Date | null;
};

// ── Facilitator Commands ─────────────────────────────────────

/**
 * Commands sent from facilitator to Jitsi via IFrame API.
 * createMeeting/destroyMeeting = restore/cut comms for a room.
 */
export type JitsiCommand =
  | { type: 'create_meeting'; roomId: RoomId }
  | { type: 'destroy_meeting'; roomId: RoomId }
  | { type: 'mute_participant'; roomId: RoomId; userId: UserId }
  | { type: 'unmute_participant'; roomId: RoomId; userId: UserId }
  | { type: 'kick_participant'; roomId: RoomId; userId: UserId }
  | { type: 'toggle_screen_share'; roomId: RoomId; userId: UserId; isAllowed: boolean };

// ── IFrame API Event Types ───────────────────────────────────

/** Events received from the Jitsi IFrame API. */
export type JitsiIFrameEvent =
  | { type: 'participant_joined'; userId: UserId; meetingId: MeetingId }
  | { type: 'participant_left'; userId: UserId; meetingId: MeetingId }
  | { type: 'audio_mute_changed'; userId: UserId; isMuted: boolean }
  | { type: 'video_mute_changed'; userId: UserId; isCameraOn: boolean }
  | { type: 'screen_share_changed'; userId: UserId; isScreenSharing: boolean }
  | { type: 'hand_raised'; userId: UserId; isHandRaised: boolean };
