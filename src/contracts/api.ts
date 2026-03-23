/**
 * API route contracts — HTTP request/response shapes for all REST endpoints.
 *
 * Convention:
 * - All responses wrap in ApiResponse<T> for consistent error handling
 * - POST/PUT bodies are typed as *Input types (from domain contracts)
 * - Query params are typed as *Query types
 * - IDs in URL paths are typed as branded string types
 * - All list endpoints support cursor-based pagination via PaginatedResponse<T>
 *
 * Socket events handle real-time (messages, typing, live updates).
 * REST handles CRUD, auth, and data fetching that doesn't need to be live.
 */

import type { User, UserId, Role } from './user';
import type {
  Exercise, ExerciseId, ExerciseStatus,
  CreateExerciseInput, UpdateExerciseInput, ObserverConfig,
} from './exercise';
import type { Room, RoomId, CreateRoomInput, UpdateRoomInput } from './room';
import type { Message, MessageId } from './message';
import type { Phase, PhaseId, Inject, InjectId, CreatePhaseInput, CreateInjectInput } from './inject';
import type { CommunicationPreset, CommunicationMatrix } from './communication';
import type { EvaluatorNote, NoteId, CreateNoteInput, UpdateNoteInput, NoteSummary, QuickTag } from './evaluator';
import type { TimelineEvent, TimelineEventType } from './timeline';
import type { Aar, AarId, AarExportFormat, AarExportInput, AarGenerationProgress } from './aar';
import type { ReconstructionData, ReconstructionAnnotation, CreateAnnotationInput, OverlayData, AnalysisOverlay, DrillDownTarget, DrillDownContent } from './reconstruction';
import type { AppError } from './errors';

// ═══════════════════════════════════════════════════════════════
// SHARED RESPONSE WRAPPERS
// ═══════════════════════════════════════════════════════════════

/**
 * Every API response is either a success with data or an error.
 * Never return a bare object — always wrap.
 */
export type ApiResponse<T> =
  | { ok: true; data: T }
  | { ok: false; error: { code: string; message: string; details?: Record<string, unknown> } };

/**
 * Cursor-based pagination. Cursor is the `createdAt` ISO string of the last item.
 * Preferred over offset-based because it's stable under inserts.
 */
export type PaginatedResponse<T> = {
  items: T[];
  /** Cursor for the next page. Null if no more items. */
  nextCursor: string | null;
  /** Total count (only included when explicitly requested via ?count=true). */
  totalCount?: number;
};

export type PaginationQuery = {
  /** Number of items per page. Default 50, max 100. */
  limit?: number;
  /** Cursor from previous response. */
  cursor?: string;
  /** Include total count in response. Default false (expensive on large tables). */
  count?: boolean;
};

// ═══════════════════════════════════════════════════════════════
// AUTH ROUTES — /api/auth/*
// ═══════════════════════════════════════════════════════════════

/** POST /api/auth/login — Magic link or email login. */
export type LoginRequest = { email: string };
export type LoginResponse = ApiResponse<{ message: string }>; // "Check your email"

/** GET /api/auth/session — Get current session. */
export type SessionResponse = ApiResponse<{ user: User; sessionId: string }>;

/** POST /api/auth/logout — End session. */
export type LogoutResponse = ApiResponse<{ message: string }>;

// ═══════════════════════════════════════════════════════════════
// EXERCISE ROUTES — /api/exercises/*
// ═══════════════════════════════════════════════════════════════

/** GET /api/exercises — List user's exercises. */
export type ListExercisesQuery = PaginationQuery & {
  status?: ExerciseStatus;
};
export type ListExercisesResponse = ApiResponse<PaginatedResponse<Exercise>>;

/** POST /api/exercises — Create exercise. */
export type CreateExerciseRequest = CreateExerciseInput;
export type CreateExerciseResponse = ApiResponse<Exercise>;

/** GET /api/exercises/:id — Get exercise detail. */
export type GetExerciseResponse = ApiResponse<Exercise>;

/** PUT /api/exercises/:id — Update exercise settings. */
export type UpdateExerciseRequest = UpdateExerciseInput;
export type UpdateExerciseResponse = ApiResponse<Exercise>;

/** POST /api/exercises/:id/start — Start the exercise. */
export type StartExerciseResponse = ApiResponse<Exercise>;

/** POST /api/exercises/:id/pause — Pause the exercise. */
export type PauseExerciseResponse = ApiResponse<Exercise>;

/** POST /api/exercises/:id/resume — Resume the exercise. */
export type ResumeExerciseResponse = ApiResponse<Exercise>;

/** POST /api/exercises/:id/complete — Complete the exercise. */
export type CompleteExerciseResponse = ApiResponse<Exercise>;

/** DELETE /api/exercises/:id — Delete draft exercise. */
export type DeleteExerciseResponse = ApiResponse<{ message: string }>;

// ═══════════════════════════════════════════════════════════════
// ROOM ROUTES — /api/exercises/:exerciseId/rooms/*
// ═══════════════════════════════════════════════════════════════

/** GET /api/exercises/:id/rooms — List rooms. */
export type ListRoomsResponse = ApiResponse<Room[]>;

/** POST /api/exercises/:id/rooms — Create room. */
export type CreateRoomRequest = CreateRoomInput;
export type CreateRoomResponse = ApiResponse<Room>;

/** GET /api/exercises/:id/rooms/:roomId — Get room. */
export type GetRoomResponse = ApiResponse<Room>;

/** PUT /api/exercises/:id/rooms/:roomId — Update room. */
export type UpdateRoomRequest = UpdateRoomInput;
export type UpdateRoomResponse = ApiResponse<Room>;

/** DELETE /api/exercises/:id/rooms/:roomId — Delete room. */
export type DeleteRoomResponse = ApiResponse<{ message: string }>;

/** POST /api/exercises/:id/rooms/:roomId/players — Add player. */
export type AddPlayerRequest = { userId: UserId };
export type AddPlayerResponse = ApiResponse<Room>;

/** DELETE /api/exercises/:id/rooms/:roomId/players/:userId — Remove player. */
export type RemovePlayerResponse = ApiResponse<Room>;

/** POST /api/join/:code — Join a room by code. */
export type JoinByCodeRequest = { displayName: string };
export type JoinByCodeResponse = ApiResponse<{ exerciseId: ExerciseId; roomId: RoomId; exerciseTitle: string }>;

// ═══════════════════════════════════════════════════════════════
// MESSAGE ROUTES — /api/exercises/:exerciseId/rooms/:roomId/messages
// ═══════════════════════════════════════════════════════════════

/**
 * GET /api/exercises/:id/rooms/:roomId/messages
 * REST for initial load + history pagination. Real-time via Socket.io.
 */
export type ListMessagesQuery = PaginationQuery;
export type ListMessagesResponse = ApiResponse<PaginatedResponse<Message>>;

/** GET /api/exercises/:id/rfis — Facilitator RFI queue. */
export type ListRfisQuery = PaginationQuery & { status?: 'pending' | 'answered' | 'deferred' | 'redirected' | 'all' };
export type ListRfisResponse = ApiResponse<PaginatedResponse<{ request: Message; response: Message | null }>>;

// ═══════════════════════════════════════════════════════════════
// PHASE & INJECT ROUTES — /api/exercises/:exerciseId/phases/*
// ═══════════════════════════════════════════════════════════════

/** GET /api/exercises/:id/phases — List all phases with injects. */
export type ListPhasesResponse = ApiResponse<Phase[]>;

/** POST /api/exercises/:id/phases — Create phase. */
export type CreatePhaseRequest = CreatePhaseInput;
export type CreatePhaseResponse = ApiResponse<Phase>;

/** POST /api/exercises/:id/phases/:phaseId/injects — Create inject. */
export type CreateInjectRequest = CreateInjectInput;
export type CreateInjectResponse = ApiResponse<Inject>;

/** PUT /api/exercises/:id/injects/:injectId — Update inject. */
export type UpdateInjectRequest = Partial<CreateInjectInput>;
export type UpdateInjectResponse = ApiResponse<Inject>;

/** DELETE /api/exercises/:id/injects/:injectId — Delete inject. */
export type DeleteInjectResponse = ApiResponse<{ message: string }>;

// ═══════════════════════════════════════════════════════════════
// STAFF ROUTES — /api/exercises/:exerciseId/staff/*
// ═══════════════════════════════════════════════════════════════

/** GET /api/exercises/:id/staff — Get all staff grouped by role. */
export type GetStaffResponse = ApiResponse<{
  facilitators: User[];
  evaluators: Array<{ user: User; assignedRoomIds: RoomId[] }>;
  observerConfig: ObserverConfig;
}>;

/** POST /api/exercises/:id/staff — Add a staff member. */
export type AddStaffRequest = { email: string; role: Role; assignedRoomIds?: RoomId[] };
export type AddStaffResponse = ApiResponse<{ userId: UserId; role: Role }>;

/** DELETE /api/exercises/:id/staff/:userId — Remove staff member. */
export type RemoveStaffResponse = ApiResponse<{ message: string }>;

/** PUT /api/exercises/:id/staff/observers — Update observer config. */
export type UpdateObserverConfigRequest = ObserverConfig;
export type UpdateObserverConfigResponse = ApiResponse<ObserverConfig>;

/** POST /api/exercises/:id/staff/observers/token — Generate observer link. */
export type GenerateObserverTokenResponse = ApiResponse<{ token: string; url: string }>;

// ═══════════════════════════════════════════════════════════════
// COMMUNICATION ROUTES — /api/exercises/:exerciseId/communication
// ═══════════════════════════════════════════════════════════════

/** GET /api/exercises/:id/communication — Get current matrix. */
export type GetCommunicationResponse = ApiResponse<{ preset: CommunicationPreset; matrix: CommunicationMatrix }>;

/** PUT /api/exercises/:id/communication — Update communication rules. */
export type UpdateCommunicationRequest = {
  preset?: CommunicationPreset;
  matrix?: CommunicationMatrix;
  /** Only applicable during active exercise. Notifies affected rooms. */
  notifyPlayers?: boolean;
  /** Inject content for notification. */
  injectContent?: string;
};
export type UpdateCommunicationResponse = ApiResponse<{ preset: CommunicationPreset; matrix: CommunicationMatrix }>;

// ═══════════════════════════════════════════════════════════════
// EVALUATOR ROUTES — /api/exercises/:exerciseId/notes/*
// ═══════════════════════════════════════════════════════════════

/** GET /api/exercises/:id/notes — List evaluator notes with filters. */
export type ListNotesQuery = PaginationQuery & {
  roomId?: RoomId;
  evaluatorId?: UserId;
  tag?: QuickTag;
};
export type ListNotesResponse = ApiResponse<PaginatedResponse<EvaluatorNote>>;

/** POST /api/exercises/:id/notes — Create note. */
export type CreateNoteRequest = CreateNoteInput;
export type CreateNoteResponse = ApiResponse<EvaluatorNote>;

/** PUT /api/exercises/:id/notes/:noteId — Update note. */
export type UpdateNoteRequest = UpdateNoteInput;
export type UpdateNoteResponse = ApiResponse<EvaluatorNote>;

/** DELETE /api/exercises/:id/notes/:noteId — Delete note. */
export type DeleteNoteResponse = ApiResponse<{ message: string }>;

/** GET /api/exercises/:id/notes/summary — Get note statistics. */
export type NoteSummaryResponse = ApiResponse<NoteSummary>;

// ═══════════════════════════════════════════════════════════════
// TIMELINE ROUTES — /api/exercises/:exerciseId/timeline
// ═══════════════════════════════════════════════════════════════

/** GET /api/exercises/:id/timeline — Get timeline events. */
export type ListTimelineQuery = PaginationQuery & {
  type?: TimelineEventType;
  roomId?: RoomId;
};
export type ListTimelineResponse = ApiResponse<PaginatedResponse<TimelineEvent>>;

// ═══════════════════════════════════════════════════════════════
// AAR ROUTES — /api/exercises/:exerciseId/aar/*
// ═══════════════════════════════════════════════════════════════

/** POST /api/exercises/:id/aar/generate — Trigger AI AAR generation. */
export type GenerateAarResponse = ApiResponse<{ aarId: AarId }>;

/** GET /api/exercises/:id/aar — Get the AAR. */
export type GetAarResponse = ApiResponse<Aar>;

/** GET /api/exercises/:id/aar/progress — SSE endpoint for generation progress. */
export type AarProgressEvent = AarGenerationProgress;

/** PUT /api/exercises/:id/aar — Update AAR (facilitator edits). */
export type UpdateAarRequest = {
  executiveSummary?: string;
  sections?: Array<{ id: string; content: string; isReviewed: boolean }>;
};
export type UpdateAarResponse = ApiResponse<Aar>;

/** POST /api/exercises/:id/aar/publish — Publish the AAR. */
export type PublishAarResponse = ApiResponse<Aar>;

/** POST /api/exercises/:id/aar/export — Export AAR in specified format. */
export type ExportAarRequest = AarExportInput;
export type ExportAarResponse = ApiResponse<{ downloadUrl: string }>;

// ═══════════════════════════════════════════════════════════════
// RECONSTRUCTION ROUTES — /api/exercises/:exerciseId/reconstruction/*
// ═══════════════════════════════════════════════════════════════

/** GET /api/exercises/:id/reconstruction — Get full reconstruction dataset. */
export type GetReconstructionResponse = ApiResponse<ReconstructionData>;

/** GET /api/exercises/:id/reconstruction/overlay/:type — Get overlay data. */
export type GetOverlayResponse = ApiResponse<OverlayData>;

/** POST /api/exercises/:id/reconstruction/drilldown — Get detail panel content. */
export type DrillDownRequest = DrillDownTarget;
export type DrillDownResponse = ApiResponse<DrillDownContent>;

/** GET /api/exercises/:id/reconstruction/annotations — List annotations. */
export type ListAnnotationsResponse = ApiResponse<ReconstructionAnnotation[]>;

/** POST /api/exercises/:id/reconstruction/annotations — Create annotation. */
export type CreateAnnotationRequest = CreateAnnotationInput;
export type CreateAnnotationResponse = ApiResponse<ReconstructionAnnotation>;

/** DELETE /api/exercises/:id/reconstruction/annotations/:annotationId — Delete. */
export type DeleteAnnotationResponse = ApiResponse<{ message: string }>;

// ═══════════════════════════════════════════════════════════════
// FILE UPLOAD ROUTES — /api/uploads/*
// ═══════════════════════════════════════════════════════════════

/**
 * Two-step upload: get presigned URL, then upload directly to S3.
 * This keeps large files off the app server.
 */

/** POST /api/uploads/presign — Get a presigned upload URL. */
export type PresignUploadRequest = {
  fileName: string;
  mimeType: string;
  fileSizeBytes: number;
  /** Context: where is this file being attached? */
  context: 'message' | 'inject' | 'note';
  exerciseId: ExerciseId;
};
export type PresignUploadResponse = ApiResponse<{
  uploadUrl: string;
  /** URL to access the file after upload completes. */
  fileUrl: string;
  /** Unique file ID to reference in messages/injects. */
  fileId: string;
  /** Upload must complete before this time. */
  expiresAt: Date;
}>;

/** POST /api/uploads/confirm — Confirm upload completed. */
export type ConfirmUploadRequest = { fileId: string };
export type ConfirmUploadResponse = ApiResponse<{ fileUrl: string; fileName: string; mimeType: string; fileSizeBytes: number }>;
