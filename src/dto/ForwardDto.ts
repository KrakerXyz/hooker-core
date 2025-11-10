import { type Id } from '@krakerxyz/utility';

/** Status of a forward attempt */
export enum ForwardStatus {
    /** Forward is queued and pending delivery */
    Pending = 'pending',
    /** Forward is currently being delivered */
    Running = 'running',
    /** Forward was successfully delivered */
    Completed = 'completed',
    /** Forward failed after all retry attempts */
    Failed = 'failed',
    /** Forward is pending a retry attempt */
    PendingReattempt = 'pendingReattempt',
}

/** 
 * Represents a forward of an event to an external endpoint based on a forwarding rule.
 * A forward tracks the delivery of a hook event to a target URL, and may have multiple
 * delivery attempts associated with it.
 */
export interface Forward {
    /** Unique identifier for this forward */
    id: Id,
    /** ID of the hook that received the original event */
    hookId: Id,
    /** ID of the forwarding rule that triggered this forward */
    forwardRuleId: Id,
    /** ID of the event being forwarded */
    eventId: Id,
    /** Target URL where the event will be forwarded */
    targetUrl: string,
    /** Timestamp when the forward was created/queued (should match the event timestamp) */
    timestamp: number,
    /** Timestamp when the status was last updated */
    statusUpdatedAt?: number,
    /** Current status of the forward */
    status: ForwardStatus,
}