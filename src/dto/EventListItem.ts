import type { EventDto } from './Event.js';
import type { ForwardStatus } from './Forward.js';

/**
 * Event item returned in list views, enriched with forward status.
 * Extends EventDto with aggregated forward information.
 */
export interface EventListItemDto extends EventDto {
    /**
     * Aggregated forward status for this event.
     * - null if no forwards exist for this event
     * - If multiple forwards exist, shows the most applicable status:
     *   Priority: failed > running > pendingReattempt > pending > completed
     */
    forwardStatus: ForwardStatus | null,
}
