# Hooker Core

> **Note:** This library is currently in **ALPHA**. Expect breaking changes in minor versions until v1.0.0.

## https://hooker.monster

Developer-friendly clients for creating and listening to webhook events in real time.

[![npm version](https://img.shields.io/npm/v/%40hooker-monster%2Fcore.svg)](https://www.npmjs.com/@hooker-monster/core)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue.svg)](https://www.typescriptlang.org/)

Hooker Core provides two lightweight clients:
- ApiClient: REST API for creating/deleting hooks and reading events
- MqttClient: Real‑time MQTT subscriptions for events and lifecycle updates

## Contents

- Installation
- Quick start
- API client
- MQTT client
  - Topics and wildcards
  - Payload shapes
  - Unsubscribe and reconnection
- Examples

## Installation

```bash
npm install @hooker-monster/core
```

Notes
- ESM only. Use import syntax in Node (Node 18+ recommended).
- Works in Node and the browser. In Node, WebSocket transport is used by the MQTT client.

## Quick start

```ts
import { ApiClient, MqttClient } from '@hooker-monster/core';

const apiKey = 'YOUR_API_KEY';
const api = new ApiClient(apiKey);

// Create a hook
const hook = await api.createHook({ id: crypto.randomUUID() });

// Listen for events in real time
const mqtt = new MqttClient(api);
await mqtt.connect();

const sub = mqtt.subscribe(`hooks/${hook.id}/events`, (evt) => {
  console.log('event:', evt.id, evt.method, evt.path);
});

// Send a test webhook to your hook URL
await fetch(hook.url, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ hello: 'world' })
});

// Clean up
sub[Symbol.dispose]();
await api.deleteHook(hook.id);
mqtt.disconnect();
```

## API client

Import
- ApiClient: `import { ApiClient } from '@hooker-monster/core'`
- DTO types (optional): `import type { HookDto, EventDto } from '@hooker-monster/core'`

Common calls
- createHook(body): Promise<HookDto>
- getHook(id): Promise<HookDto>
- getMyHooks(): Promise<HookDto[]>
- deleteHook(id): Promise<void>
- getEvents(hookId, { limit, beforeTs, beforeId }): Promise<EventsListDto>
- getEvent(eventId): Promise<EventDto>
- getEventBody(eventId): Promise<string>
- bookmarkEvent(eventId, state): Promise<EventDto>
- getConfig(): Promise<AppConfigDto>
- getMqttAuthUser(): Promise<MqttJwtConfigDto>
- getMqttAuthHook(hookId): Promise<MqttJwtConfigDto>

Errors: non‑2xx responses throw Error with a helpful message parsed from the server when available.

## MQTT client

Import
- MqttClient: `import { MqttClient } from '@hooker-monster/core'`

Connect/disconnect
```ts
const mqtt = new MqttClient(apiClient);
await mqtt.connect();
// ...
mqtt.disconnect();
```

Subscribe/unsubscribe
```ts
const disposable = mqtt.subscribe(`hooks/${hookId}/events`, (e) => console.log(e));
// later
disposable[Symbol.dispose]();
```

### Topics and wildcards

You can subscribe to specific resources or use MQTT wildcards.

Wildcards
- `+` matches a single level
- `#` matches multiple levels and must be the last token

Topics
- `hooks/{hookId}/events` → EventDto for inbound webhooks
- `hooks/{hookId}/events/{eventId}/deleted` → MqttDeletedDto when an event is deleted
- `hooks/{hookId}/created` → HookDto when a hook is created
- `hooks/{hookId}/updated` → HookDto when a hook is updated
- `hooks/{hookId}/deleted` → MqttDeletedDto when a hook is deleted
- `hooks/{hookId}/forwards/queued` → ForwardDto when a forward is queued
- `hooks/{hookId}/forwards/{forwardId}/status-changes/{status}` → ForwardDto when forward status changes
- `hooks/{hookId}/forwards/{forwardId}/attempts` → ForwardAttemptDto for each forward delivery attempt

Wildcard examples
- `hooks/+/events` → events for all your hooks
- `hooks/+/events/+/deleted` → deletions for any event on any hook
- `hooks/+/forwards/+/status-changes/#` → all forward status changes for all hooks
- `hooks/+/forwards/+/status-changes/completed` → only completed forwards for all hooks
- `hooks/{hookId}/forwards/+/attempts` → all forward attempts for a specific hook

Notes
- Topics are automatically scoped to your user account. The client handles authentication and prefixing internally.
- Reconnect is enabled and subscriptions are re‑applied on reconnect.

### Payload shapes

Types are exported for convenience
- EventDto: `import type { EventDto } from '@hooker-monster/core'`
- HookDto: `import type { HookDto } from '@hooker-monster/core'`
- MqttDeletedDto: `import type { MqttDeletedDto } from '@hooker-monster/core'`
- ForwardDto: `import type { ForwardDto } from '@hooker-monster/core'`
- ForwardAttemptDto: `import type { ForwardAttemptDto } from '@hooker-monster/core'`

EventDto (summary)
- id, hookId, method, path, querystring, headers, body, bodyIncluded, timestamp, ip, contentType, bookmarked

ForwardDto (summary)
- id, hookId, forwardRuleId, eventId, targetUrl, timestamp, statusUpdatedAt, status

ForwardAttemptDto (summary)
- id, forwardId, timestamp, statusCode, contentType, responseBody, durationMs

### Large Request Bodies

For performance reasons, large request bodies (>5KB by default) are not included in event list results (`getEvents`). In these cases, the `body` field will be `null` and `bodyIncluded` will be `false`.

To retrieve the full event data including the body, use `getEvent(eventId)`. Alternatively, you can retrieve just the body content using `getEventBody(eventId)`.

```ts
// In list results, body might be null
const events = await api.getEvents(hookId);
const event = events.items[0];

if (!event.bodyIncluded) {
  // Fetch full event to get the body
  const fullEvent = await api.getEvent(event.id);
  console.log('Body:', fullEvent.body);
}
```

### Examples

Minimal end‑to‑end
```ts
import { ApiClient, MqttClient } from '@hooker-monster/core';

const api = new ApiClient(process.env.HOOKER_TOKEN!);
const hook = await api.createHook({ id: crypto.randomUUID() });

const mqtt = new MqttClient(api);
await mqtt.connect();

const sub = mqtt.subscribe(`hooks/${hook.id}/events`, (e) => console.log('received', e));

await fetch(hook.url, { method: 'POST', body: JSON.stringify({ ping: true }), headers: { 'Content-Type': 'application/json' } });

sub[Symbol.dispose]();
await api.deleteHook(hook.id);
mqtt.disconnect();
```
