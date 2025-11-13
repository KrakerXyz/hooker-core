import type { Id } from '@krakerxyz/utility';

/** Body payload for logging in with email/password */
export interface LoginBody {
    /** User's email address */
    email: string,
    /** User's password */
    password: string,
}

/** Login error codes */
export enum LoginErrorCode {
    /** User needs to verify their email before logging in */
    NeedsVerified = 'needsVerified',
    /** Invalid credentials provided */
    InvalidCredentials = 'invalidCredentials',
}

/** Response for successful login */
export interface LoginSuccessDto {
    success: true,
    user: {
        id: Id,
        email: string,
        name: string | null,
        avatarUrl: string | null,
        emailVerified: boolean,
        createdAt: string,
        updatedAt: string,
    },
}

/** Response for failed login */
export interface LoginErrorDto {
    success: false,
    errorCode: LoginErrorCode,
}

/** Login result - either success with user or error with code */
export type LoginResultDto = LoginSuccessDto | LoginErrorDto;
