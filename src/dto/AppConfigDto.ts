/** App configuration exposed to client. */
export interface AppConfigDto {
    mqtt: {
        brokerUrl: string,
        clientIdPrefix: string,
    },
}