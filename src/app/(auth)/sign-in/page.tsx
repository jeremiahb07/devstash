import Link from "next/link";

import { SignInForm } from "@/components/auth/SignInForm";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

/**
 * `/sign-in` is Auth.js's `pages.signIn`, so it also receives the redirect for
 * anything that fails while signing in — most of which happens off-page, in the
 * OAuth callback, where there is no form submission to report against.
 *
 * The keys are Auth.js's own error codes, except `SessionInvalid`, which is ours
 * — see `src/app/api/auth/stale-session/route.ts`.
 */
const SIGN_IN_ERRORS: Record<string, string> = {
  SessionInvalid:
    "You were signed out because that account no longer exists. Sign in with another account, or create one.",
  OAuthAccountNotLinked:
    "That email already has an account. Sign in the way you did the first time, then link GitHub from your profile.",
  OAuthSignin: "Could not reach GitHub. Please try again.",
  OAuthCallback: "GitHub did not complete the sign-in. Please try again.",
  AccessDenied: "You do not have access to this account.",
  Verification: "That sign-in link has expired. Please request a new one.",
  Configuration:
    "Sign-in is misconfigured on the server. Please contact support.",
};

const GENERIC_ERROR = "Something went wrong signing you in. Please try again.";

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{
    error?: string;
    callbackUrl?: string;
  }>;
}) {
  const { error, callbackUrl } = await searchParams;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Welcome back</CardTitle>
        <CardDescription>Sign in to your DevStash account</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <SignInForm
          callbackUrl={callbackUrl}
          initialError={error ? (SIGN_IN_ERRORS[error] ?? GENERIC_ERROR) : null}
        />
        <p className="text-center text-sm text-muted-foreground">
          Don&apos;t have an account?{" "}
          <Link
            href="/register"
            className="font-medium text-foreground underline-offset-4 hover:underline"
          >
            Create one
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
