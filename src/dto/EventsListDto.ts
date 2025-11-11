import { type EventDto } from './EventDto.js';
import { type EventListItemDto } from './EventListItemDto.js';

export interface EventsListDtoCursor {
    beforeTs: number,
    beforeId: string,
}

export interface EventsListDto {
    items: EventListItemDto[],
    nextCursor: EventsListDtoCursor | null,
}

export type { EventDto, EventListItemDto };
