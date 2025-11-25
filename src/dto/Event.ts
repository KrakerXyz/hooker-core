import type { Id } from '@krakerxyz/utility';
import type { AttachmentMetaDto } from './AttachmentMeta.js';

export type ReceiverType = 'webhook' | 'email';

/** Single captured inbound HTTP request tied to a hook. */
export interface EventDto {
    /** Event id */
    id: Id,
    /** Parent hook id */
    hookId: Id,
    /** How this event was received */
    receiverType: ReceiverType,
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
    /** Attachments associated with this event (e.g., email attachments, form uploads) */
    attachments?: AttachmentMetaDto[],
}
    