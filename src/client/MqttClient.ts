import Paho from 'paho-mqtt';
import type { Client, Message } from 'paho-mqtt';
import { type EventDto } from '../dto/Event.js';
import { type HookDto } from '../dto/Hook.js';
import { type MqttDeletedDto } from '../dto/MqttDeleted.js';
import { type ForwardDto } from '../dto/Forward.js';
import { type ForwardAttemptDto } from '../dto/ForwardAttempt.js';
import { type ApiClient } from './ApiClient.js';
import { type Id } from '@krakerxyz/utility';

// Reconnect backoff: doubles each failed attempt, capped, with jitter.
const RECONNECT_BASE_MS = 1_000;
const RECONNECT_MAX_MS = 30_000;
const RECONNECT_JITTER_MS = 1_000;

export class MqttClient {

    private _subscriptions: Map<string, Set<(x: any) => void>> = new Map();
    private _client: Client | null = null;
    private _userId: string | null = null;
    private _brokerUrl: string | null = null;
    private _clientIdPrefix: string = '';
    // Set when we tear the client down on purpose so a dying socket can't
    // trigger an unwanted reconnect loop.
    private _intentionallyClosed: boolean = false;
    private _reconnecting: boolean = false;
    private _reconnectAttempts: number = 0;
    private _reconnectTimer: ReturnType<typeof setTimeout> | null = null;

    public constructor(private readonly apiClient: ApiClient) {
        // A long main-thread freeze drops the socket. When the tab becomes
        // responsive again, reconnect immediately instead of waiting out the
        // backoff. Guarded for non-browser (Node) environments.
        if (typeof document !== 'undefined') {
            document.addEventListener('visibilitychange', () => this.onVisibilityChange());
        }
    }

    public async connect(): Promise<void> {
        const config = await this.apiClient.getConfig();
        this._brokerUrl = config.mqtt.brokerUrl;
        this._clientIdPrefix = config.mqtt.clientIdPrefix;

        const me = await this.apiClient.me();
        if (!me.user?.id) {
            throw new Error('Failed to get user ID for MQTT authentication');
        }
        this._userId = me.user.id;
        this._intentionallyClosed = false;

        await this.openConnection();
    }

    /**
     * Fetches a fresh JWT, wires up the handlers and connects a new client.
     * A fresh JWT is fetched on every call (including reconnects) because the
     * MQTT password is a short-lived token - reusing the original one would
     * make reconnection fail permanently once it expires.
     */
    private async openConnection(): Promise<void> {
        if (!this._brokerUrl) {
            throw new Error('MQTT broker URL not available. Ensure connect() was called.');
        }

        const jwt = await this.apiClient.getMqttAuthUser();
        const clientId = `${this._clientIdPrefix}${Date.now()}`;
        const client = new Paho.Client(this._brokerUrl, clientId);
        this._client = client;

        client.onMessageArrived = (message: Message) => this.handleMessage(message);

        client.onConnectionLost = (res: { errorCode: number, errorMessage: string }) => {
            // Ignore callbacks from a client we have already replaced.
            if (this._client !== client) { return; }
            if (this._intentionallyClosed) { return; }
            console.warn(`MQTT connection lost (code ${res.errorCode}): ${res.errorMessage || 'N/A'}. Reconnecting...`);
            this.scheduleReconnect();
        };

        await new Promise<void>((resolve, reject) => {
            client.connect({
                userName: jwt.username,
                password: jwt.password,
                useSSL: this._brokerUrl!.startsWith('wss'),
                // Reconnection is managed here so we can refresh the JWT and use
                // a clean client each attempt - Paho's built-in reconnect reuses
                // the original (expiring) credentials.
                reconnect: false,
                timeout: 30,
                keepAliveInterval: 60,
                cleanSession: true,
                onSuccess: () => {
                    if (this._client !== client) {
                        resolve();
                        return;
                    }
                    this.resubscribeAll(client);
                    resolve();
                },
                onFailure: (err: unknown) => {
                    reject(err);
                },
            });
        });
    }

    private resubscribeAll(client: Client): void {
        for (const topic of this._subscriptions.keys()) {
            client.subscribe(topic, {
                onFailure: (error: unknown) => {
                    console.error(`Failed to resubscribe to topic ${topic} on reconnect:`, error);
                }
            });
        }
    }

    private scheduleReconnect(): void {
        if (this._intentionallyClosed) { return; }
        if (this._reconnectTimer) { return; }

        const backoff = Math.min(RECONNECT_BASE_MS * 2 ** this._reconnectAttempts, RECONNECT_MAX_MS);
        const delay = backoff + Math.floor(Math.random() * RECONNECT_JITTER_MS);
        this._reconnectTimer = setTimeout(() => {
            this._reconnectTimer = null;
            void this.reconnect();
        }, delay);
    }

    private async reconnect(): Promise<void> {
        if (this._intentionallyClosed) { return; }
        if (this._reconnecting) { return; }
        if (this._client?.isConnected()) { return; }

        this._reconnecting = true;
        this._reconnectAttempts++;

        // Orphan the previous client so its dead socket and stale pingers can't
        // drive reconnect logic or throw "WebSocket is already CLOSED" errors.
        if (this._client) {
            this.orphanClient(this._client);
        }

        try {
            await this.openConnection();
            if (this._intentionallyClosed && this._client) {
                this.orphanClient(this._client);
                return;
            }
            this._reconnectAttempts = 0;
        } catch (err) {
            console.error(`MQTT reconnect attempt ${this._reconnectAttempts} failed:`, err);
            this.scheduleReconnect();
        } finally {
            this._reconnecting = false;
        }
    }

    private onVisibilityChange(): void {
        if (document.visibilityState !== 'visible') { return; }
        if (this._intentionallyClosed || this._reconnecting) { return; }
        if (this._client?.isConnected()) { return; }
        if (this._reconnectTimer) {
            clearTimeout(this._reconnectTimer);
            this._reconnectTimer = null;
        }
        this._reconnectAttempts = 0;
        void this.reconnect();
    }

    /** Detaches callbacks and disconnects a client so it can no longer drive any logic. */
    private orphanClient(client: Client): void {
        client.onConnectionLost = () => { /* orphaned */ };
        client.onMessageArrived = () => { /* orphaned */ };
        try {
            client.disconnect();
        } catch {
            // Expected when the client is already disconnected.
        }
    }

    private handleMessage(message: Message): void {
        const topic = message.destinationName;
        const cbs = new Set<(x: any) => void>;

        const topicParts = topic.split('/');

        for (const [subscribedTopic, subscribers] of this._subscriptions.entries()) {
            if (this.isTopicMatch(subscribedTopic, topicParts)) {
                for (const cb of subscribers) {
                    cbs.add(cb);
                }
            }
        }

        const payload = message.payloadString || '';
        try {
            const json = JSON.parse(payload);
            cbs.forEach(cb => cb(json));
        } catch {
            throw new Error(`Failed to parse MQTT message payload as JSON: ${payload}`);
        }
    }

    public disconnect(): void {
        this._intentionallyClosed = true;
        if (this._reconnectTimer) {
            clearTimeout(this._reconnectTimer);
            this._reconnectTimer = null;
        }
        if (this._client) {
            this.orphanClient(this._client);
        }
        this._client = null;
    }

    private isTopicMatch(subscribed: string, receivedParts: string[]): boolean {
        const subscribedParts = subscribed.split('/');
        const subLen = subscribedParts.length;
        const receivedLen = receivedParts.length;

        for (let i = 0; i < subLen; i++) {
            const subPart = subscribedParts[i];

            if (subPart === '#' && i === (subLen - 1)) {
                // If '#' is the last part of the subscription, it's a match
                return true;
            }

            if (i >= receivedLen) {
                return false;
            }

            if (subPart === '+') {
                continue; // '+' matches any single level
            }

            const receivedPart = receivedParts[i];
            if (subPart !== receivedPart) {
                return false;
            }

            // Continue checking the next parts
        }

        return subLen === receivedLen;
    }

    public subscribe(topic: `hooks/${string | Id}/events`, cb: (x: EventDto) => void): Promise<Disposable>;
    public subscribe(topic: `hooks/${string | Id}/events/${string | Id}/deleted`, cb: (x: MqttDeletedDto) => void): Promise<Disposable>;
    public subscribe(topic: `hooks/${string | Id}/created`, cb: (x: HookDto) => void): Promise<Disposable>;
    public subscribe(topic: `hooks/${string | Id}/updated`, cb: (x: HookDto) => void): Promise<Disposable>;
    public subscribe(topic: `hooks/${string | Id}/deleted`, cb: (x: MqttDeletedDto) => void): Promise<Disposable>;
    public subscribe(topic: `hooks/${string | Id}/forwards/queued`, cb: (x: ForwardDto) => void): Promise<Disposable>;
    public subscribe(topic: `hooks/${string | Id}/forwards/${string | Id}/status-changes/${string}`, cb: (x: ForwardDto) => void): Promise<Disposable>;
    public subscribe(topic: `hooks/${string | Id}/forwards/${string | Id}/status-changes/#`, cb: (x: ForwardDto) => void): Promise<Disposable>;
    public subscribe(topic: `hooks/${string | Id}/forwards/${string | Id}/attempts`, cb: (x: ForwardAttemptDto) => void): Promise<Disposable>;
    public async subscribe(topic: string, cb: (x: any) => void): Promise<Disposable> {
        if (!this._client?.isConnected()) {
            return Promise.reject(new Error('MQTT client is not connected'));
        }

        if (!this._userId) {
            return Promise.reject(new Error('User ID not available. Ensure connect() completed successfully.'));
        }

        // Automatically prefix with hooker/users/{userId}/
        const fullTopic = `hooker/users/${this._userId}/${topic}`;

        let existingCbs = this._subscriptions.get(fullTopic);

        const disposable: Disposable = {
            [Symbol.dispose]: () => {
                const cbs = this._subscriptions.get(fullTopic);
                if (!cbs) { return; }
                cbs.delete(cb);
                if (cbs.size === 0) {
                    this._subscriptions.delete(fullTopic);
                    if (this._client?.isConnected()) {
                        this._client.unsubscribe(fullTopic, {
                            onFailure: (error: unknown) => {
                                console.error(`Failed to unsubscribe from topic ${fullTopic}:`, error);
                            }
                        });
                    }
                }
            }
        };

        if (existingCbs) {

            existingCbs.add(cb);

            return disposable;
        }

        return new Promise((resolve, reject) => {

            this._client!.subscribe(fullTopic, {
                onSuccess: () => {
                    existingCbs = this._subscriptions.get(fullTopic) ?? new Set();
                    this._subscriptions.set(fullTopic, existingCbs);
                    existingCbs.add(cb);
                    resolve(disposable);
                },
                onFailure: (error: unknown) => {
                    console.error(`Failed to subscribe to topic ${fullTopic}. Verify user has access`);
                    reject(error);
                }
            });

        });
    }
}
