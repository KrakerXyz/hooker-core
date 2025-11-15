import { type Id } from '@krakerxyz/utility';

export interface MqttDeletedDto {
    deletedAt: number,
    userId: Id | null,
}
