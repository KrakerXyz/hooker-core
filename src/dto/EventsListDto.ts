import { type EventDto } from './EventDto.js';

export interface EventsListDtoCursor {
    beforeTs: number,
    beforeId: string,
}

export interface EventsListDto {
    items: EventDto[],
    nextCursor: EventsListDtoCursor | null,
}

export type { EventDto };
