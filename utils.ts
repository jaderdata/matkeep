export const formatUSPhone = (value: string) => {
    if (!value) return value;
    const phoneNumber = value.replace(/[^\d]/g, '');
    const phoneNumberLength = phoneNumber.length;
    if (phoneNumberLength < 4) return phoneNumber;
    if (phoneNumberLength < 7) {
        return `(${phoneNumber.slice(0, 3)}) ${phoneNumber.slice(3)}`;
    }
    return `(${phoneNumber.slice(0, 3)}) ${phoneNumber.slice(
        3,
        6
    )}-${phoneNumber.slice(6, 10)}`;
};

/**
 * Normalize full name for UNIQUE constraint validation
 * - Remove accents
 * - Trim extra spaces
 * - Convert to lowercase
 * Used for UNIQUE(academy_id, phone_e164, full_name_normalized)
 */
export const normalizeFullName = (fullName: string): string => {
    if (!fullName) return '';

    // Normalize accents (NFD = decomposed form)
    const normalized = fullName
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '') // Remove diacritics
        .trim()
        .replace(/\s+/g, ' ') // Replace multiple spaces with single space
        .toLowerCase();

    return normalized;
};

/**
 * Format phone to E.164 international format
 * Assumes Brazilian phone numbers for now
 * Input: (11) 99999-9999 or 11999999999
 * Output: +5511999999999
 */
export const formatPhoneToE164 = (phone: string): string => {
    if (!phone) return '';

    // Extract only digits
    const digitsOnly = phone.replace(/\D/g, '');

    // If already has 11+ digits (assuming +55 country code added), normalize
    if (digitsOnly.length >= 13) {
        return '+' + digitsOnly;
    }

    // If 11 digits, assume Brazil without country code
    if (digitsOnly.length === 11) {
        return '+55' + digitsOnly;
    }

    // If 10 digits, assume US or similar, don't force +55 if it's 407 (Orlando) etc.
    if (digitsOnly.length === 10) {
        return '+1' + digitsOnly; // Default to US if 10 digits
    }

    // Otherwise, return with + if it has many digits, or use input as is
    if (digitsOnly.length > 10) {
        return '+' + digitsOnly;
    }

    return digitsOnly;
};

/**
 * Check if a user has Master Admin privileges
 * Checks both app_metadata and user_metadata for role: 'master'
 */
export const isMaster = (user: any): boolean => {
    if (!user) return false;

    // Check app_metadata (preferred for secure claims)
    if (user.app_metadata?.role === 'master') return true;

    // Check user_metadata (fallback or explicit set)
    if (user.user_metadata?.role === 'master') return true;

    // TODO: Remove this hardcoded check once all master users have the role set in DB
    // Keeping for temporary backward compatibility during migration
    if (user.email === 'jader_dourado@hotmail.com') return true;

    return false;
};

/**
 * Check if a user is an Academy Admin
 * Default role for most users if not master
 */
export const isAcademyAdmin = (user: any): boolean => {
    if (!user) return false;
    // If they have a user object and ARE NOT master, they are effectively an academy admin
    // (unless we add more roles later like 'instructor', 'student' etc at this auth level)
    return !isMaster(user);
};
