import type { Id } from '@krakerxyz/utility';

export interface AccessTokenDto {
    id: Id,
    token: string,
    description: string,
    lastUsed: number | null,
    timestamp: number,
}

export interface AccessTokenBody {
    description: string,
}
