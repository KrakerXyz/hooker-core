import type { Id } from '@krakerxyz/utility';

/** Hook visibility (event list access control). */
export enum HookVisibility {
    /** Anyone can read events */
    Public = 'Public',
    /** Only owner (future: collaborators) */
    Private = 'Private',
}

/** Parent record for grouping events. */
export interface HookDto {
    readonly id: Id,
    readonly timestamp: number,
    // Owner user id, or null for anonymous ownership
    readonly createdBy: Id | null,
    /** Owner verify token for anonymous ownership */
    readonly ownerVerify?: string | null,
    visibility: HookVisibility,
    /** Optional human-friendly display name (settable by owner). */
    name?: string | null,
    /** Execution node where this hook is hosted (e.g., "kat"). */
    readonly node: string,
    /** Full public URL to send webhooks to for this hook (derived from PUBLIC_URL). */
    readonly url: string,
}

// Generate a random verification token (25 chars) for anonymous hook owners.
// Uses URL-safe base62 characters for compactness.
/** Generate a 25-char verification token (base62). */
export function newVerify(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    const length = 25;
    let bytes: Uint8Array | undefined;

    if (typeof globalThis.crypto !== 'undefined' && typeof globalThis.crypto.getRandomValues === 'function') {
        bytes = new Uint8Array(length);
        globalThis.crypto.getRandomValues(bytes);
    } else {
        try {
            const req = Function('return typeof require!=="undefined" ? require : null')();
            const nodeCrypto = req && req('node:crypto');
            if (nodeCrypto?.randomBytes) {
                bytes = nodeCrypto.randomBytes(length);
            }
        } catch { /* ignore */ }
    }

    if (!bytes) {
        throw new Error('Secure random generation not supported in this environment');
    }

    let out = '';
    for (let i = 0; i < length; i++) {
        out += chars[bytes[i] % chars.length];
    }
    return out;
}

/** Body payload for creating a hook (API). */
export interface HookCreateBody {
    /** Client-chosen hook id (must be unique, validated server-side). */
    id: Id,
    /** Optional pre-generated owner verification token (only used when anonymous; server creates one if omitted). */
    ownerVerify?: string | null,
    /** Visibility override; defaults to Public when not provided. Private requires authenticated user. */
    visibility?: HookVisibility,
}

/** Body for updating a hook's visibility (and optionally claiming ownership). */
export interface HookVisibilityUpdateBody {
    /** Desired visibility state. */
    visibility: HookVisibility,
    /** Owner verification token (required if claiming unowned hook using anonymous token). */
    ownerVerify?: string | null,
}

/** Body for claiming ownership of an unowned hook (separate from visibility change). */
export interface HookClaimBody {
    /** Owner verification token (must match stored ownerVerify). */
    ownerVerify: string,
}

/** Body for updating a hook's display name (owner only). */
export interface HookNameUpdateBody {
    /** New name or null to clear. Recommended max ~120 chars. */
    name: string | null,
}
