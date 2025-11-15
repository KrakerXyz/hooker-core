import { type EventDto } from './Event.js';
import { type EventListItemDto } from './EventListItem.js';

export interface EventsListDtoCursor {
    beforeTs: number,
    beforeId: string,
}

export interface EventsListDto {
    items: EventListItemDto[],
    nextCursor: EventsListDtoCursor | null,
}

export type { EventDto, EventListItemDto };
