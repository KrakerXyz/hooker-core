export interface UserDto {
    id: string,
    email: string,
    name?: string | null,
    avatarUrl?: string | null,
    createdAt: string, // ISO timestamp
    updatedAt: string, // ISO timestamp
}
