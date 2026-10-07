/**
 * Signup-wizard Pendo track helper shared by the four step pages.
 *
 * `signup_validation_failed` fires from every step's submit (the RHF
 * `onInvalid` callback) and from Step 1's email / username uniqueness checks,
 * so the payload is built in one place — identical property names across
 * steps keep the per-step drop-off analysis consistent.
 */

/** Wizard step number → stable step name (matches the step page / URL slug). */
const SIGNUP_STEP_NAMES = {
  1: 'account',
  2: 'details',
  3: 'company',
  4: 'preferences',
} as const

export type SignupStep = keyof typeof SIGNUP_STEP_NAMES

/** Why the submit was blocked: Zod field validation or a Step 1 uniqueness conflict. */
export type SignupValidationFailureType = 'validation' | 'duplicate_email' | 'duplicate_username'

/**
 * Track a blocked signup-step submit. Reports field NAMES only — never the
 * values the user typed (emails, passwords, names).
 */
export function trackSignupValidationFailed(
  step: SignupStep,
  invalidFields: string[],
  failureType: SignupValidationFailureType = 'validation',
): void {
  if (typeof pendo !== 'undefined') {
    pendo.track('signup_validation_failed', {
      step,
      stepName: SIGNUP_STEP_NAMES[step],
      invalidFields: invalidFields.join(', '),
      errorCount: invalidFields.length,
      failureType,
    })
  }
}
