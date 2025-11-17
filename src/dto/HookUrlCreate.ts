/**
 * Request body for creating a new non-primary hook URL.
 * 
 * @property name - URL-safe name (pattern: /^[a-z0-9_-]{1,50}$/, max length: 50)
 */
export interface HookUrlCreateBody {
    /**
     * URL-safe name for the hook URL.
     * Must match pattern: /^[a-z0-9_-]{1,50}$/
     * Max length: 50 characters
     */
    name: string,
}
