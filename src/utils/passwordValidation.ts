/**
 * Validates password strength according to requirements
 * Requirements: 14+ characters, uppercase, lowercase, numbers, special characters
 */
export function validatePasswordStrength(password: string): { valid: boolean, errors: string[] } {
    const errors: string[] = [];

    if (password.length < 14) {
        errors.push('Password must be at least 14 characters long');
    }

    if (!/[A-Z]/.test(password)) {
        errors.push('Password must contain at least one uppercase letter');
    }

    if (!/[a-z]/.test(password)) {
        errors.push('Password must contain at least one lowercase letter');
    }

    if (!/[0-9]/.test(password)) {
        errors.push('Password must contain at least one number');
    }

    if (!/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password)) {
        errors.push('Password must contain at least one special character');
    }

    return {
        valid: errors.length === 0,
        errors,
    };
}

/**
 * Get password strength level for visual indicator
 */
export function getPasswordStrength(password: string): 'weak' | 'medium' | 'strong' {
    const validation = validatePasswordStrength(password);

    if (validation.valid) {
        // Check for strong password (18+ chars or extra variety)
        if (password.length >= 18) {
            return 'strong';
        }
        return 'medium';
    }

    // Check how many requirements are met
    const requirementsMet = 5 - validation.errors.length;
    if (requirementsMet >= 3) {
        return 'medium';
    }

    return 'weak';
}
