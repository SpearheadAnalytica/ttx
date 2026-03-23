/**
 * Error contracts — typed error hierarchy for the TTX platform.
 *
 * Design decisions:
 * - Errors are plain objects, not class instances (serializable over the wire).
 * - Every error has a unique `code` (machine-readable) and `message` (human-readable).
 * - Errors carry structured `details` for debugging without leaking internals.
 * - HTTP status codes are mapped from error codes, not stored on the error.
 * - The "fail loudly" principle means these errors are ALWAYS thrown, never swallowed.
 *
 * Pattern: throw using factory functions (e.g., `throw notFound('Exercise', id)`).
 * The global error handler catches, logs, and returns the appropriate ApiResponse.
 */

// ═══════════════════════════════════════════════════════════════
// BASE ERROR TYPE
// ═══════════════════════════════════════════════════════════════

export type AppError = {
  /** Machine-readable error code. Used for error handling in code. */
  code: ErrorCode;
  /** Human-readable message. Safe to show to users. */
  message: string;
  /** Structured details for debugging. Logged server-side, NOT sent to client in production. */
  details: Record<string, unknown>;
};

// ═══════════════════════════════════════════════════════════════
// ERROR CODES — exhaustive union
// ═══════════════════════════════════════════════════════════════

export type ErrorCode =
  // ── Auth (401/403) ──
  | 'AUTH_REQUIRED'             // No session / token expired
  | 'AUTH_INVALID_TOKEN'        // Token malformed or expired
  | 'AUTH_FORBIDDEN'            // Authenticated but not authorized for this action

  // ── Not Found (404) ──
  | 'NOT_FOUND'                 // Generic resource not found
  | 'EXERCISE_NOT_FOUND'
  | 'ROOM_NOT_FOUND'
  | 'MESSAGE_NOT_FOUND'
  | 'PHASE_NOT_FOUND'
  | 'INJECT_NOT_FOUND'
  | 'NOTE_NOT_FOUND'
  | 'USER_NOT_FOUND'
  | 'AAR_NOT_FOUND'

  // ── Validation (400) ──
  | 'VALIDATION_ERROR'          // Generic input validation failure
  | 'INVALID_INPUT'             // Malformed request body
  | 'MISSING_REQUIRED_FIELD'    // Required field is null/undefined
  | 'INVALID_RICH_TEXT'         // Tiptap JSON content is malformed
  | 'FILE_TOO_LARGE'            // Upload exceeds size limit
  | 'UNSUPPORTED_FILE_TYPE'     // MIME type not allowed

  // ── State Conflicts (409) ──
  | 'INVALID_STATUS_TRANSITION' // e.g., DRAFT → COMPLETED (must go through ACTIVE)
  | 'EXERCISE_NOT_DRAFT'        // Trying to edit when exercise is active/completed
  | 'EXERCISE_NOT_ACTIVE'       // Trying to send message when exercise isn't running
  | 'EXERCISE_ALREADY_STARTED'  // Trying to start an already-active exercise
  | 'RFI_ALREADY_ANSWERED'      // Trying to answer an RFI that's already resolved
  | 'DUPLICATE_PARTICIPANT'     // User already has a role in this exercise
  | 'ROOM_FULL'                 // Room player limit reached (if implemented)

  // ── Permission (403) ──
  | 'PERMISSION_DENIED'         // Generic: role doesn't allow this action
  | 'NOT_FACILITATOR'           // Action requires facilitator role
  | 'NOT_EVALUATOR'             // Action requires evaluator role
  | 'NOT_IN_ROOM'               // Player trying to act in a room they're not in
  | 'COMMUNICATION_BLOCKED'     // Cross-room message blocked by matrix rules
  | 'NOT_NOTE_AUTHOR'           // Trying to edit someone else's evaluator note

  // ── Rate Limiting (429) ──
  | 'RATE_LIMITED'              // Too many requests
  | 'AAR_GENERATION_IN_PROGRESS' // AAR already being generated

  // ── Server (500) ──
  | 'INTERNAL_ERROR'            // Unexpected server error
  | 'DATABASE_ERROR'            // Prisma/PostgreSQL failure
  | 'SOCKET_ERROR'              // Socket.io connection/emission failure
  | 'AI_SERVICE_ERROR'          // AI agent (AAR generation) failure
  | 'FILE_UPLOAD_ERROR';        // S3/MinIO failure

// ═══════════════════════════════════════════════════════════════
// HTTP STATUS CODE MAPPING
// ═══════════════════════════════════════════════════════════════

export const ERROR_HTTP_STATUS: Record<ErrorCode, number> = {
  // 400
  VALIDATION_ERROR: 400,
  INVALID_INPUT: 400,
  MISSING_REQUIRED_FIELD: 400,
  INVALID_RICH_TEXT: 400,
  FILE_TOO_LARGE: 400,
  UNSUPPORTED_FILE_TYPE: 400,

  // 401
  AUTH_REQUIRED: 401,
  AUTH_INVALID_TOKEN: 401,

  // 403
  AUTH_FORBIDDEN: 403,
  PERMISSION_DENIED: 403,
  NOT_FACILITATOR: 403,
  NOT_EVALUATOR: 403,
  NOT_IN_ROOM: 403,
  COMMUNICATION_BLOCKED: 403,
  NOT_NOTE_AUTHOR: 403,

  // 404
  NOT_FOUND: 404,
  EXERCISE_NOT_FOUND: 404,
  ROOM_NOT_FOUND: 404,
  MESSAGE_NOT_FOUND: 404,
  PHASE_NOT_FOUND: 404,
  INJECT_NOT_FOUND: 404,
  NOTE_NOT_FOUND: 404,
  USER_NOT_FOUND: 404,
  AAR_NOT_FOUND: 404,

  // 409
  INVALID_STATUS_TRANSITION: 409,
  EXERCISE_NOT_DRAFT: 409,
  EXERCISE_NOT_ACTIVE: 409,
  EXERCISE_ALREADY_STARTED: 409,
  RFI_ALREADY_ANSWERED: 409,
  DUPLICATE_PARTICIPANT: 409,
  ROOM_FULL: 409,

  // 429
  RATE_LIMITED: 429,
  AAR_GENERATION_IN_PROGRESS: 429,

  // 500
  INTERNAL_ERROR: 500,
  DATABASE_ERROR: 500,
  SOCKET_ERROR: 500,
  AI_SERVICE_ERROR: 500,
  FILE_UPLOAD_ERROR: 500,
};

// ═══════════════════════════════════════════════════════════════
// ERROR FACTORY FUNCTIONS
// ═══════════════════════════════════════════════════════════════

/**
 * Factory signatures for creating errors.
 * Implementation is trivial — these exist to enforce consistent error shape.
 */

/** Resource not found. */
export type NotFoundFactory = (resource: string, id: string) => AppError;
// Implementation: { code: `${RESOURCE}_NOT_FOUND`, message: `${resource} not found: ${id}`, details: { resource, id } }

/** Validation failure. */
export type ValidationErrorFactory = (field: string, reason: string) => AppError;
// Implementation: { code: 'VALIDATION_ERROR', message: `Invalid ${field}: ${reason}`, details: { field, reason } }

/** Permission denied. */
export type PermissionDeniedFactory = (action: string, requiredRole: string) => AppError;
// Implementation: { code: 'PERMISSION_DENIED', message: `Cannot ${action}: requires ${requiredRole} role`, details: { action, requiredRole } }

/** Invalid state transition. */
export type InvalidTransitionFactory = (resource: string, currentStatus: string, targetStatus: string) => AppError;
// Implementation: { code: 'INVALID_STATUS_TRANSITION', message: `Cannot transition ${resource} from ${currentStatus} to ${targetStatus}`, details: { resource, currentStatus, targetStatus } }

/** Communication blocked between rooms. */
export type CommunicationBlockedFactory = (fromRoomId: string, toRoomId: string) => AppError;
// Implementation: { code: 'COMMUNICATION_BLOCKED', message: 'Communication blocked between rooms', details: { fromRoomId, toRoomId } }
