/**
 * Whether a password account has to confirm its email address before it can
 * sign in.
 *
 * The switch exists because the Resend account backing this app has no verified
 * domain, so the only sender available delivers *just* to the Resend account
 * owner's own address — see the header of `src/lib/email.ts`. With verification
 * required, that makes every other address unusable. Turning it off lets any
 * address register and sign in immediately.
 *
 * This is the only place `EMAIL_VERIFICATION_ENABLED` is read. It is a
 * server-only variable on purpose: nothing here is exposed through
 * `NEXT_PUBLIC_`, and the client learns what happened from the register
 * response instead of reading the policy itself.
 */

/**
 * Only these turn it off. Anything else — unset, empty, a typo, "no", "off" —
 * leaves verification required, so a mistake in the environment fails towards
 * the stricter behaviour rather than silently opening registration up.
 */
const DISABLED_VALUES = new Set(["false", "0"]);

/**
 * Read per call rather than captured at module load, so the value comes from the
 * running process's environment and not from whatever was set when this module
 * was first imported.
 */
export function isEmailVerificationEnabled(): boolean {
  const value = process.env.EMAIL_VERIFICATION_ENABLED?.trim().toLowerCase();

  return !(value && DISABLED_VALUES.has(value));
}
