/** Body payload for changing password (authenticated) */
export interface ChangePasswordBody {
    /** Current password (required if user has password set) */
    currentPassword?: string,
    /** New password (min 14 chars, uppercase, lowercase, numbers, special chars) */
    newPassword: string,
}
