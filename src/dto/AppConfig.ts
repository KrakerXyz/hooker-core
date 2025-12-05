/** App configuration exposed to client. */
export interface AppConfigDto {
    mqtt: {
        brokerUrl: string,
        clientIdPrefix: string,
    },
    /** Base domain for incoming emails (e.g. "mail.example.com"). Email addresses are constructed as hookName@node.smtpBaseDomain. Optional - if not set, email ingestion is disabled. */
    smtpBaseDomain?: string,
}