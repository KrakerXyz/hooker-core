/** Body payload for resetting password with code */
export interface ResetPasswordBody {
    /** 8-character reset code (A-Z uppercase) */
    code: string,
    /** New password (min 14 chars, uppercase, lowercase, numbers, special chars) */
    newPassword: string,
}
