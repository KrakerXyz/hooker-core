/** Body payload for deleting account (authenticated) */
export interface DeleteAccountBody {
    /** Password confirmation (required for local accounts) */
    password?: string,
}
