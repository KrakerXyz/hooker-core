import type { Id } from '@krakerxyz/utility';

export type AttachmentType = 'form-data' | 'eml' | 'eml-attachment';

export interface AttachmentMetaDto {
    id: Id,
    name: string,
    length: number,
    type: AttachmentType,
    mimeType: string,
}
