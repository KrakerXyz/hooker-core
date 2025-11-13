import type { Id } from '@krakerxyz/utility';

/** Body payload for registering a new user with email/password */
export interface RegisterBody {
    /** Client-chosen user id (must be unique, validated server-side) */
    id: Id,
    /** User's email address */
    email: string,
    /** Password (min 14 chars, uppercase, lowercase, numbers, special chars) */
    password: string,
}
