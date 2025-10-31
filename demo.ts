
import { ApiClient } from './src/client/ApiClient.js';
import { MqttClient } from './src/client/MqttClient.js';

const apiKey = 'dbe8b0c466592f2e694b5316cd4c93b5ff9ea924a990e3ee9ed23b2967651dc9';

const apiClient = new ApiClient(apiKey, { baseUrl: 'http://localhost:3000' });

const mqttClient = new MqttClient(apiClient);
await mqttClient.connect();
console.log('Connected to MQTT broker');

const newHook = await apiClient.createHook({ id: crypto.randomUUID() });

console.log(`Created Hook ${newHook.id}`);

const { promise: mqttReceived, resolve: mqttResolve } = Promise.withResolvers<void>();
mqttClient.subscribe(`hooker/hooks/${newHook.id}/events`, (event) => {
    console.log(`Received event via MQTT: ${event.body}`);
    mqttResolve();
});

await fetch(newHook.url.replace('5173','3000'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ test: 'Hello world from the demo' }),
});
console.log('Sent test webhook to', newHook.url);

await mqttReceived;

await apiClient.deleteHook(newHook.id);
console.log(`Deleted Hook ${newHook.id}`);

await mqttClient.disconnect();

process.exit(0);