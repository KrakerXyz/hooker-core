export interface UserDto {
    id: string,
    email: string,
    name?: string | null,
    avatarUrl?: string | null,
    emailVerified: boolean,
    createdAt: string, // ISO timestamp
    updatedAt: string, // ISO timestamp
    /** Effective max payload size (MB) for this user's hooks; -1 means unlimited. */
    effectiveMaxPayloadMb: number,
}
