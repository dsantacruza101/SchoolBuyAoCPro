/**
 * The email domain that every school user must belong to.
 * Google sign-in is rejected for any email that does not end with this domain.
 */
export const SCHOOL_DOMAIN = 'academyofthecity.org';

/** Human-readable school name used in UI copy and Firestore metadata. */
export const SCHOOL_NAME = 'Academy of the City Charter School';

/**
 * Maps Firebase Auth error codes to user-facing messages.
 * An empty string means the error should be silently swallowed (e.g. user closed the popup).
 */
export const AUTH_ERROR_MAP: Record<string, string> = {
  'auth/invalid-email':                             'Invalid email address.',
  'auth/user-disabled':                             'This account has been disabled.',
  'auth/user-not-found':                            'No account found with this email.',
  'auth/wrong-password':                            'Incorrect email or password.',
  'auth/invalid-credential':                        'Incorrect email or password.',
  'auth/too-many-requests':                         'Too many failed attempts — try again in a few minutes.',
  'auth/network-request-failed':                    'Network error — check your connection.',
  'auth/popup-blocked':                             'Popup was blocked — allow popups for this site and try again.',
  'auth/popup-closed-by-user':                      '',
  'auth/account-exists-with-different-credential':  'An account already exists with this email using a different sign-in method.',
};
