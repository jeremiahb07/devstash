import Link from "next/link";
import { CircleCheck, CircleAlert, MailWarning } from "lucide-react";

import { ResendVerificationForm } from "@/components/auth/ResendVerificationForm";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

type Status = "verified" | "already-verified" | "expired" | "invalid";

const OUTCOMES: Record<
  Status,
  {
    icon: typeof CircleCheck;
    tone: string;
    title: string;
    description: string;
    /** Whether to offer another link. */
    resend: boolean;
  }
> = {
  verified: {
    icon: CircleCheck,
    tone: "text-emerald-500",
    title: "Email confirmed",
    description: "Your address is verified. You can sign in now.",
    resend: false,
  },
  "already-verified": {
    icon: CircleCheck,
    tone: "text-emerald-500",
    title: "Already confirmed",
    description: "This address was verified previously. Just sign in.",
    resend: false,
  },
  expired: {
    icon: MailWarning,
    tone: "text-amber-500",
    title: "This link expired",
    description:
      "Verification links are good for 24 hours. Request a new one below.",
    resend: true,
  },
  invalid: {
    // Deliberately not phrased as an error the visitor caused: a used token and
    // one that never existed are indistinguishable here, and mail scanners
    // routinely open links before a human does.
    icon: CircleAlert,
    tone: "text-muted-foreground",
    title: "This link is no longer valid",
    description:
      "It may already have been used, or it expired. Request a new one below, or sign in if you have already confirmed.",
    resend: true,
  },
};

function toStatus(value?: string): Status {
  return value === "verified" ||
    value === "already-verified" ||
    value === "expired"
    ? value
    : "invalid";
}

/**
 * Renders the outcome of a verification attempt. Purely presentational — the
 * token is redeemed by `/api/auth/verify-email`, which redirects here with a
 * `status`, so this page never writes and a refresh replays nothing.
 */
export default async function VerifyEmailPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status } = await searchParams;
  const outcome = OUTCOMES[toStatus(status)];
  const Icon = outcome.icon;

  return (
    <Card>
      <CardHeader>
        <span className={outcome.tone}>
          <Icon className="size-6" aria-hidden />
        </span>
        <CardTitle>{outcome.title}</CardTitle>
        <CardDescription>{outcome.description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {outcome.resend ? (
          <ResendVerificationForm />
        ) : (
          // `render`, not `asChild` — this Button wraps Base UI's primitive.
          // `nativeButton={false}` because the render prop supplies an anchor:
          // Base UI otherwise assumes a real <button> and warns that the native
          // semantics it relies on are gone. A link is right here — this
          // navigates, it does not submit.
          <Button
            render={<Link href="/sign-in" />}
            nativeButton={false}
            size="lg"
            className="w-full"
          >
            Sign in
          </Button>
        )}

        <p className="text-center text-sm text-muted-foreground">
          {outcome.resend ? (
            <>
              Already confirmed?{" "}
              <Link
                href="/sign-in"
                className="font-medium text-foreground underline-offset-4 hover:underline"
              >
                Sign in
              </Link>
            </>
          ) : (
            <>
              Need a different account?{" "}
              <Link
                href="/register"
                className="font-medium text-foreground underline-offset-4 hover:underline"
              >
                Create one
              </Link>
            </>
          )}
        </p>
      </CardContent>
    </Card>
  );
}
