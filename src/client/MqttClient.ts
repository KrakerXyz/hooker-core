import Paho from 'paho-mqtt';
import type { Client, Message } from 'paho-mqtt';
import { type EventDto } from '../dto/Event.js';
import { type HookDto } from '../dto/Hook.js';
import { type MqttDeletedDto } from '../dto/MqttDeleted.js';
import { type ForwardDto } from '../dto/Forward.js';
import { type ForwardAttemptDto } from '../dto/ForwardAttempt.js';
import { type ApiClient } from './ApiClient.js';
import { type Id } from '@krakerxyz/utility';

export class MqttClient {

    private _subscriptions: Map<string, Set<(x: any) => void>> = new Map();
    private _client: Client | null = null;
    private _userId: string | null = null;

    public constructor(private readonly apiClient: ApiClient) { }

    public async connect(): Promise<void> {

        const config = await this.apiClient.getConfig();
        const brokerUrl = config.mqtt.brokerUrl;
        const clientId = `${config.mqtt.clientIdPrefix}${Date.now()}`;

        const me = await this.apiClient.me();
        if (!me.user?.id) {
            throw new Error('Failed to get user ID for MQTT authentication');
        }
        this._userId = me.user.id;

        const jwt = await this.apiClient.getMqttAuthUser();
        const username = jwt.username;
        const password = jwt.password;
    
        this._client = new Paho.Client(brokerUrl, clientId);

        this._client.onMessageArrived = (message: Message) => {
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
        };

        await new Promise<void>((resolve, reject) => {
            this._client!.connect({
                userName: username,
                password: password,
                useSSL: brokerUrl.startsWith('wss'),
                reconnect: true,
                timeout: 30,
                keepAliveInterval: 60,
                cleanSession: true,
                onSuccess: () => {
                    // subscribe to all topics that have subscriptions
                    for (const topic of this._subscriptions.keys()) {
                        this._client!.subscribe(topic, {
                            onFailure: (error: any) => {
                                throw new Error(`Failed to resubscribe to topic ${topic} on reconnect`, error);
                            }
                        });
                    }
                    resolve();
                },
                onFailure: (err: unknown) => {
                    reject(err);
                },
            });
        });
    }

    public disconnect(): void {
        if (this._client?.isConnected()) {
            this._client.disconnect();
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