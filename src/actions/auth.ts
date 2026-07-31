"use server";

import { AuthError } from "next-auth";

import { signIn, signOut } from "@/auth";
import { credentialsSchema } from "@/lib/validations/auth";

/** Where a successful sign-in lands when nothing else was asked for. */
const DEFAULT_REDIRECT = "/dashboard";

/** Where signing out lands. */
const SIGN_OUT_REDIRECT = "/sign-in";

export interface SignInState {
  error: string | null;
  /**
   * Echoed back so the form can restore it: React resets an uncontrolled form
   * once its action settles, which would otherwise clear the email on every
   * failed attempt.
   */
  email?: string;
}

/**
 * `callbackUrl` reaches us from the query string, so only same-site paths are
 * honoured. Auth.js's own redirect callback would reject an absolute URL too,
 * but it silently falls back to the site root — checking here means a tampered
 * value behaves like no value at all.
 */
function safeRedirect(value: FormDataEntryValue | null) {
  if (typeof value !== "string") return DEFAULT_REDIRECT;

  // "//evil.com" and "/\evil.com" are paths to the browser but origins to a
  // redirect, so require a single leading slash.
  return /^\/(?!\/|\\)/.test(value) ? value : DEFAULT_REDIRECT;
}

/**
 * Email/password sign-in, driven by `useActionState` so the form can render the
 * failure inline instead of bouncing through `/sign-in?error=`.
 *
 * On success `signIn` throws a Next.js redirect, which has to escape this
 * function untouched — hence rethrowing anything that isn't an `AuthError`.
 */
export async function signInWithCredentials(
  _previous: SignInState,
  formData: FormData,
): Promise<SignInState> {
  const submitted = formData.get("email");
  const email = typeof submitted === "string" ? submitted : undefined;

  const parsed = credentialsSchema.safeParse({
    email: submitted,
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0].message, email };
  }

  try {
    await signIn("credentials", {
      ...parsed.data,
      redirectTo: safeRedirect(formData.get("callbackUrl")),
    });
  } catch (error) {
    if (error instanceof AuthError) {
      // `authorize` returns null for both "no such account" and "wrong
      // password", so there is only one message to give.
      return { error: "Invalid email or password", email };
    }

    throw error;
  }

  // Unreachable: a successful `signIn` redirects.
  return { error: null };
}

/**
 * Hands off to GitHub. Failures here can't be caught the way credentials ones
 * are — the user leaves the site and comes back through the OAuth callback, so
 * Auth.js redirects to `/sign-in?error=...`, which the page renders.
 */
export async function signInWithGitHub(formData: FormData) {
  await signIn("github", {
    redirectTo: safeRedirect(formData.get("callbackUrl")),
  });
}

export async function signOutAction() {
  await signOut({ redirectTo: SIGN_OUT_REDIRECT });
}
