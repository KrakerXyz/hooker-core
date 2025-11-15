import { type Id } from '@krakerxyz/utility';

/**
 * Represents a single delivery attempt for a forward.
 * Multiple attempts may be made for a single forward in case of failures or retries.
 * Captures the complete response data from the target endpoint.
 */
export interface ForwardAttemptDto {
    /** Unique identifier for this attempt */
    id: Id,
    /** ID of the forward this attempt belongs to */
    forwardId: Id,
    /** Timestamp when this attempt was made */
    timestamp: number,
    /** HTTP status code returned from the target URL */
    statusCode: number,
    /** Content-Type header from the response, if present */
    contentType?: string,
    /** Response body returned from the target URL (captured regardless of success or failure) */
    responseBody?: string,
    /** Duration of the HTTP request in milliseconds */
    durationMs: number,
}