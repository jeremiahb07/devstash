"use server";

import { AuthError } from "next-auth";

import { signIn, signOut } from "@/auth";
import { EmailNotVerifiedError } from "@/lib/auth/errors";
import {
  buildVerificationUrl,
  issueVerificationToken,
  verificationCooldownRemaining,
} from "@/lib/auth/verification";
import { isEmailVerificationEnabled } from "@/lib/auth/verification-policy";
import { sendVerificationEmail } from "@/lib/email";
import { prisma } from "@/lib/prisma";
import { credentialsSchema, emailSchema } from "@/lib/validations/auth";

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
  /**
   * Set when the password was right but the address is unconfirmed, so the form
   * can offer to send another link instead of only stating the problem.
   */
  unverified?: boolean;
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
    // Thrown by `authorize` only once the password has already checked out, so
    // saying this much reveals nothing to someone guessing addresses.
    if (error instanceof EmailNotVerifiedError) {
      return {
        error:
          "Confirm your email address before signing in. Check your inbox for the link.",
        email,
        unverified: true,
      };
    }

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

export interface ResendVerificationState {
  message: string | null;
  ok: boolean;
}

/**
 * Sends another verification link, for a link that expired or never arrived.
 *
 * This answers plainly whether an address has an account. That is a deliberate
 * match to the register endpoint, which already replies "An account with that
 * email already exists" — being coy here while the front door announces it
 * would cost the honest user clarity and buy an attacker nothing.
 *
 * The per-address cooldown is the throttle that matters: without it this is an
 * unauthenticated endpoint that will mail any address on demand, as often as
 * asked.
 */
export async function resendVerificationEmail(
  _previous: ResendVerificationState,
  formData: FormData,
): Promise<ResendVerificationState> {
  // Answered before the address is even parsed: with verification switched off
  // there is nothing to send whoever is asking, so there is no reason to look up
  // whether the account exists.
  if (!isEmailVerificationEnabled()) {
    return {
      ok: true,
      message: "Email confirmation is not required right now — just sign in.",
    };
  }

  const parsed = emailSchema.safeParse(formData.get("email"));

  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0].message };
  }

  const email = parsed.data;

  const user = await prisma.user.findUnique({
    where: { email },
    select: { name: true, emailVerified: true, password: true },
  });

  if (!user) {
    return { ok: false, message: "No account uses that email address." };
  }

  if (user.emailVerified) {
    return { ok: true, message: "That address is already confirmed — sign in." };
  }

  // A GitHub-only row has nothing to verify: it never had a password, and the
  // gate that would block it only runs in the credentials path.
  if (!user.password) {
    return { ok: true, message: "That account signs in with GitHub." };
  }

  const waitMs = await verificationCooldownRemaining(email);

  if (waitMs > 0) {
    const seconds = Math.ceil(waitMs / 1000);

    return {
      ok: false,
      message: `A link was just sent. Try again in ${seconds} second${seconds === 1 ? "" : "s"}.`,
    };
  }

  const { token } = await issueVerificationToken(email);
  const { sent } = await sendVerificationEmail({
    to: email,
    name: user.name,
    url: buildVerificationUrl(token),
  });

  if (!sent) {
    return {
      ok: false,
      message: "Could not send the email just now. Please try again shortly.",
    };
  }

  return { ok: true, message: "Sent. Check your inbox for the new link." };
}
