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
    /** Raw body text */
    body: string | null,
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
    