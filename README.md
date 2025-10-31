# Hooker Core

Developer-friendly clients for creating hooks and listening to webhook events in real time.

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

npm install @hooker-monster/core

Notes
- ESM only. Use import syntax in Node (Node 18+ recommended).
- Works in Node and the browser. In Node, WebSocket transport is used by the MQTT client.

import { ApiClient, MqttClient } from '@hooker-monster/core';

const apiKey = 'YOUR_API_KEY';
const api = new ApiClient(apiKey);

// Create a hook
const hook = await api.createHook({ id: crypto.randomUUID() });

// Listen for events in real time
const mqtt = new MqttClient(api);
await mqtt.connect();

const sub = mqtt.subscribe(`hooker/hooks/${hook.id}/events`, (evt) => {
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
const disposable = mqtt.subscribe(`hooker/hooks/${hookId}/events`, (e) => console.log(e));
// later
disposable[Symbol.dispose]();
```

### Topics and wildcards

You can subscribe to specific resources or use MQTT wildcards.

Wildcards
- `+` matches a single level
- `#` matches multiple levels and must be the last token

Hook‑scoped topics
- `hooker/hooks/{hookId}/events` → EventDto for inbound webhooks
- `hooker/hooks/{hookId}/events/{eventId}/deleted` → MqttDeletedDto when an event is deleted
- `hooker/hooks/{hookId}/created` → HookDto when a hook is created
- `hooker/hooks/{hookId}/updated` → HookDto when a hook is updated
- `hooker/hooks/{hookId}/deleted` → MqttDeletedDto when a hook is deleted

User‑scoped topics (requires user JWT; MqttClient uses this by default)
- `hooker/users/{userId}/hooks/{hookId}/events`
- `hooker/users/{userId}/hooks/{hookId}/events/{eventId}/deleted`
- `hooker/users/{userId}/hooks/{hookId}/created`
- `hooker/users/{userId}/hooks/{hookId}/updated`
- `hooker/users/{userId}/hooks/{hookId}/deleted`

Wildcard examples
- `hooker/hooks/+/events` → events for all hooks
- `hooker/hooks/+/events/+/deleted` → deletions for any event on any hook
- `hooker/hooks/#` → everything under hooks (events and lifecycle)
- `hooker/users/+/hooks/+/events` → events for all hooks owned by any user id

Notes
- MqttClient obtains a user‑scoped JWT via ApiClient.getMqttAuthUser(), enabling user topics above.
- Reconnect is enabled and subscriptions are re‑applied on reconnect.

### Payload shapes

Types are exported for convenience
- EventDto: `import type { EventDto } from '@hooker-monster/core'`
- HookDto: `import type { HookDto } from '@hooker-monster/core'`
- MqttDeletedDto: `import type { MqttDeletedDto } from '@hooker-monster/core'`

EventDto (summary)
- id, hookId, method, path, querystring, headers, body, timestamp, ip, contentType, bookmarked

### Examples

Minimal end‑to‑end
```ts
import { ApiClient, MqttClient } from '@hooker-monster/core';

const api = new ApiClient(process.env.HOOKER_TOKEN!);
const hook = await api.createHook({ id: crypto.randomUUID() });

const mqtt = new MqttClient(api);
await mqtt.connect();

const sub = mqtt.subscribe(`hooker/hooks/${hook.id}/events`, (e) => console.log('received', e));

await fetch(hook.url, { method: 'POST', body: JSON.stringify({ ping: true }), headers: { 'Content-Type': 'application/json' } });

sub[Symbol.dispose]();
await api.deleteHook(hook.id);
mqtt.disconnect();
```
