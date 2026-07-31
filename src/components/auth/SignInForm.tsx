"use client";

import { useActionState } from "react";

import { signInWithCredentials, signInWithGitHub } from "@/actions/auth";
import { FormError } from "@/components/auth/FormError";
import { PasswordInput } from "@/components/auth/PasswordInput";
import { SubmitButton } from "@/components/auth/SubmitButton";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

/** Lucide dropped its brand icons, so the GitHub mark is inlined. */
function GitHubIcon(props: React.ComponentProps<"svg">) {
  return (
    <svg viewBox="0 0 16 16" fill="currentColor" aria-hidden {...props}>
      <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0 0 16 8c0-4.42-3.58-8-8-8Z" />
    </svg>
  );
}

export interface SignInFormProps {
  /** Where to land after signing in — carried through by the proxy. */
  callbackUrl?: string;
  /** An `?error=` from a sign-in that failed off-page, in the OAuth callback. */
  initialError: string | null;
}

export function SignInForm({ callbackUrl, initialError }: SignInFormProps) {
  // Seeding the action state with the URL's error means a later submission
  // simply replaces it, rather than the two racing to be displayed.
  const [state, formAction] = useActionState(signInWithCredentials, {
    error: initialError,
  });

  return (
    <div className="space-y-4">
      <FormError message={state.error} />

      <form action={formAction} className="space-y-3">
        {callbackUrl && (
          <input type="hidden" name="callbackUrl" value={callbackUrl} />
        )}

        <div className="space-y-1.5">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            className="h-9"
            // React resets the form once the action settles, so the address has
            // to be handed back in the state to survive a failed attempt. The
            // key remounts the field rather than mutating `defaultValue` in
            // place, which Base UI warns about on an uncontrolled input.
            key={state.email ?? ""}
            defaultValue={state.email}
            required
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="password">Password</Label>
          <PasswordInput
            id="password"
            name="password"
            autoComplete="current-password"
            className="h-9"
            required
          />
        </div>

        <SubmitButton size="lg" className="w-full">
          Sign in
        </SubmitButton>
      </form>

      <div className="flex items-center gap-3">
        <span className="h-px flex-1 bg-border" />
        <span className="text-xs tracking-wide text-muted-foreground uppercase">
          or
        </span>
        <span className="h-px flex-1 bg-border" />
      </div>

      {/* A sibling form, not a nested one — HTML does not allow nesting. */}
      <form action={signInWithGitHub}>
        {callbackUrl && (
          <input type="hidden" name="callbackUrl" value={callbackUrl} />
        )}
        <SubmitButton variant="outline" size="lg" className="w-full">
          <GitHubIcon className="size-4" />
          Sign in with GitHub
        </SubmitButton>
      </form>
    </div>
  );
}
