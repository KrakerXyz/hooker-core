import type { Id } from '@krakerxyz/utility';

/**
 * Represents a hook URL.
 * Each hook can have multiple URLs (e.g., different names on same or different nodes).
 * Exactly one URL per hook is marked as primary.
 */
export interface HookUrlDto {
    id: Id,
    hookId: Id,
    /** URL-safe name (pattern: /^[a-z0-9_-]{1,50}$/) */
    name: string,
    /** Execution node (e.g., "kat") */
    node: string,
    /** Whether this is the primary URL for the hook */
    isPrimary: boolean,
    /** Full public URL (derived from node + name) */
    url: string,
}
