import type { Id } from '@krakerxyz/utility';

/** Column types supported in events table UI layouts. */
export enum ColumnType {
    bookmark = 'bookmark',
    eventId = 'eventId',
    timestamp = 'timestamp',
    method = 'method',
    forwardStatus = 'forwardStatus',
    hookId = 'hookId',
    path = 'path',
    ip = 'ip',
    contentType = 'contentType',
    body = 'body',
    actions = 'actions',
    custom = 'custom',
}
/** Per-hook column configuration row. */
export interface ColumnDto {
    id: Id,
    type: ColumnType,
    name: string,
    /** Width % (0 => auto) */
    widthPct: number,
    show: boolean,
    /** JSONPath used only for custom columns */
    jsonPath?: string,
}

/** Body payload for replacing all columns of a hook. */
export interface SaveColumnsBody {
    columns: ColumnDto[],
}

/** Body payload for bookmarking/unbookmarking an event. */
export interface EventBookmarkBody {
    /** Desired bookmark state (true to bookmark, false to clear). */
    state: boolean,
}

