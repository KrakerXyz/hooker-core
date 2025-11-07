import fetch from 'cross-fetch';
import { type EventsListDto } from '../dto/EventsListDto.js';
import { type EventDto } from '../dto/EventDto.js';
import { type HookDto, type HookCreateBody, type HookVisibilityUpdateBody, type HookNameUpdateBody } from '../dto/HookDto.js';
import { type ColumnDto, type SaveColumnsBody } from '../dto/ColumnsDto.js';
import { type AppConfigDto } from '../dto/AppConfigDto.js';
import { type MqttJwtConfigDto } from '../dto/MqttJwtConfigDto.js';
import { type Id } from '@krakerxyz/utility';

export type ApiClientOptions = {
    baseUrl?: string,
};

/**
 * A lightweight client for interacting with the Hooker API.
 */
export class ApiClient {
    private baseUrl: string;
    private token: string;

    /**
     * Creates a new instance of the HookerClient.
     * @param token The access token for authentication.
     * @param options Optional parameters.
     * @param options.baseUrl The base URL of the Hooker instance. Defaults to https://hooker.monster.
     */
    constructor(token: string, options?: ApiClientOptions) {
        this.token = token;
        const baseUrl = options?.baseUrl || 'https://hooker.monster';
        this.baseUrl = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
    }

    private async request<T>(path: string, options: RequestInit = {}): Promise<T> {
        const url = `${this.baseUrl}${path}`;
        const headers = new Headers(options.headers);
        headers.set('Authorization', `Token ${this.token}`);

        if (options.body) {
            headers.set('Content-Type', 'application/json');
        }

        const response = await fetch(url, { ...options, headers });

        if (!response.ok) {
            const errorBody = await response.text();
            let errorMessage = `API request failed with status ${response.status}`;
            if (errorBody) {
                try {
                    const parsed = JSON.parse(errorBody);
                    if (parsed.error) {
                        errorMessage = parsed.error;
                    } else {
                        errorMessage += `: ${errorBody}`;
                    }
                } catch {
                    errorMessage += `: ${errorBody}`;
                }
            }
            throw new Error(errorMessage);
        }

        if (response.status === 204) {
            return null as T;
        }

        return response.json() as Promise<T>;
    }

    // #region Hooks
    /**
     * Creates a new hook.
     * @param body The hook creation data.
     * @returns A promise that resolves to the created hook.
     */
    async createHook(body: HookCreateBody): Promise<HookDto> {
        return this.request<HookDto>('/api/hooks', {
            method: 'POST',
            body: JSON.stringify(body)
        });
    }

    /**
     * Retrieves the details of a specific hook.
     * @param hookId The ID of the hook to retrieve.
     * @returns A promise that resolves to the hook details.
     */
    async getHook(hookId: Id): Promise<HookDto> {
        return this.request<HookDto>(`/api/hooks/${hookId}`);
    }

    /**
     * Updates the name of a hook.
     * @param id The ID of the hook.
     * @param body The name update data.
     * @returns A promise that resolves to the updated hook.
     */
    async updateHookName(id: Id, body: HookNameUpdateBody): Promise<HookDto> {
        return this.request<HookDto>(`/api/hooks/${id}/name`, {
            method: 'POST',
            body: JSON.stringify(body)
        });
    }

    /**
     * Updates the visibility of a hook.
     * @param id The ID of the hook.
     * @param body The visibility update data.
     * @returns A promise that resolves to the updated hook.
     */
    async updateHookVisibility(id: Id, body: HookVisibilityUpdateBody): Promise<HookDto> {
        return this.request<HookDto>(`/api/hooks/${id}/visibility`, {
            method: 'POST',
            body: JSON.stringify(body)
        });
    }

    /**
     * Retrieves a list of hooks owned by the authenticated user.
     * @returns A promise that resolves to a list of hooks.
     */
    async getMyHooks(): Promise<HookDto[]> {
        return this.request<HookDto[]>('/api/hooks');
    }

    /**
     * Deletes a hook.
     * @param hookId The ID of the hook to delete.
     */
    async deleteHook(hookId: Id): Promise<void> {
        return this.request<void>(`/api/hooks/${hookId}`, {
            method: 'DELETE'
        });
    }
    // #endregion

    // #region Events
    /**
     * Lists the events for a specific hook.
     * @param hookId The ID of the hook.
     * @param options Pagination options.
     * @returns A promise that resolves to a list of events.
     */
    async getEvents(hookId: Id, options?: { limit?: number, beforeTs?: number, beforeId?: string }): Promise<EventsListDto> {
        const params = new URLSearchParams();
        if (options?.limit) params.set('limit', String(options.limit));
        if (options?.beforeTs) params.set('beforeTs', String(options.beforeTs));
        if (options?.beforeId) params.set('beforeId', String(options.beforeId));
        const queryString = params.toString();
        return this.request<EventsListDto>(`/api/events/${hookId}${queryString ? `?${queryString}` : ''}`);
    }

    /**
     * Toggle bookmark for an event.
     * @param eventId The ID of the event.
     * @param state The bookmark state.
     * @returns A promise that resolves to the updated event.
     */
    async bookmarkEvent(eventId: Id, state: boolean): Promise<EventDto> {
        return this.request<EventDto>(`/api/events/${eventId}/bookmark`, {
            method: 'POST',
            body: JSON.stringify({ state })
        });
    }

    /**
     * Deletes an event.
     * @param eventId The ID of the event to delete.
     */
    async deleteEvent(eventId: Id): Promise<void> {
        return this.request<void>(`/api/events/${eventId}`, {
            method: 'DELETE'
        });
    }
    // #endregion

    // #region Columns
    /**
     * Retrieves the columns for a specific hook.
     * @param hookId The ID of the hook.
     * @returns A promise that resolves to a list of columns.
     */
    async getHookColumns(hookId: Id): Promise<ColumnDto[]> {
        return this.request<ColumnDto[]>(`/api/hooks/${hookId}/columns`);
    }

    /**
     * Saves the columns for a specific hook.
     * @param hookId The ID of the hook.
     * @param body The columns to save.
     * @returns A promise that resolves to the saved columns.
     */
    async saveHookColumns(hookId: Id, body: SaveColumnsBody): Promise<ColumnDto[]> {
        return this.request<ColumnDto[]>(`/api/hooks/${hookId}/columns`, {
            method: 'POST',
            body: JSON.stringify(body)
        });
    }
    // #endregion

    // #region Config
    /**
     * Retrieves the application configuration.
     * @returns A promise that resolves to the app configuration.
     */
    async getConfig(): Promise<AppConfigDto> {
        return this.request<AppConfigDto>('/api/config');
    }

    /**
     * Retrieves MQTT authentication credentials for the authenticated user.
     * This allows subscribing to all hooks owned by the user.
     * @returns A promise that resolves to the MQTT JWT configuration.
     */
    async getMqttAuthUser(): Promise<MqttJwtConfigDto> {
        return this.request<MqttJwtConfigDto>('/api/config/mqtt-jwt-user');
    }

    /**
     * Retrieves MQTT authentication credentials for a specific hook.
     * This allows subscribing only to the specified hook.
     * @param hookId The ID of the hook.
     * @returns A promise that resolves to the MQTT JWT configuration.
     */
    async getMqttAuthHook(hookId: Id): Promise<MqttJwtConfigDto> {
        return this.request<MqttJwtConfigDto>(`/api/config/mqtt-jwt-hook/${hookId}`);
    }
    // #endregion
}
