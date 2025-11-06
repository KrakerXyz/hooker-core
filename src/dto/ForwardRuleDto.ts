import { type Id } from '@krakerxyz/utility';

/** Rule for conditionally forwarding events to another endpoint */
export interface ForwardRuleDto {
    /** Forwarding rule id */
    id: Id,
    /** Hook id associated with the forwarding rule */
    hookId: Id,
    /** Target URL for the forwarding rule */
    targetUrl: string,
    /** Whether the forwarding rule should be processed for incoming hooks */
    isActive: boolean,
    /** Timestamp for when the forwarding rule was created */
    timestamp: number,
    /** Filters that must all match for the rule to apply */
    passFilters?: Filter[],
    /** Filters that must NOT match for the rule to apply */
    failFilters?: Filter[],
}

export type ValueSelector = {
    type: 'header',
    name: string,
} | {
    type: 'query',
    name: string,
} | {
    type: 'body-json',
    /** JSON path to the value. If body is not value json, undefined will be returned */
    path: string,
} | {
    type: 'body-text',
}

export enum MatchType {
    Equals = 'equals',
    Contains = 'contains',
    StartsWith = 'startsWith',
    Regex = 'regex',
}

export interface Filter {
    selector: ValueSelector,
    matchType: MatchType,
    matchValue: string,
    invert: boolean,
}