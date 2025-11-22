import type { Id } from '@krakerxyz/utility';

/** Single captured inbound HTTP request tied to a hook. */
export interface EventDto {
    /** Event id */
    id: Id,
    /** Parent hook id */
    hookId: Id,
    /** Path (no origin) */
    path: string,
    /** Raw querystring (no leading ?) */
    querystring: string,
    method: string,
    /** Raw body text. This will be null when the body is not loaded (e.g. too large for list view) */
    body: string | null,
    /** Whether the body is loaded in this object. If false, fetch the single event to get the body. */
    bodyIncluded: boolean,
    /** Original request headers */
    headers: unknown,
    /** Received time (ms epoch) */
    timestamp: number,
    /** Remote IP */
    ip: string,
    /** Content-Type header */
    contentType: string | null,
    /** User bookmark flag */
    bookmarked: boolean,
}
    