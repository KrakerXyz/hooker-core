/** MQTT auth credentials (JWT passed via password). */
export interface MqttJwtConfigDto {
    username: string,
    password: string,
    expiresAt: number,
}
