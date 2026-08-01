import { CredentialsSignin } from "next-auth";

/**
 * Thrown by the credentials `authorize` when the password is right but the
 * address has never been confirmed.
 *
 * It lives in its own module because both `src/auth.ts` (which throws it) and
 * `src/actions/auth.ts` (which catches it) need it, and importing the action
 * from the config — or the other way round — would be a cycle.
 *
 * Auth.js only substitutes its own generic `CredentialsSignin` when `authorize`
 * *returns* null; a thrown error propagates untouched, which is what lets this
 * one be told apart from a wrong password by the caller.
 */
export class EmailNotVerifiedError extends CredentialsSignin {
  /** Surfaces in the redirect URL, so it must not say anything sensitive. */
  code = "email_not_verified";
}
