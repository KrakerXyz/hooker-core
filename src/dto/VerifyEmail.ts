/** Body payload for verifying email with code */
export interface VerifyEmailBody {
    /** 8-character verification code (A-Z uppercase) */
    code: string,
}
