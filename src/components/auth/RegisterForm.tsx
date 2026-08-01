"use client";

import { useState } from "react";
import { MailCheck, MailWarning } from "lucide-react";
import type { ZodError } from "zod";

import { FormError } from "@/components/auth/FormError";
import { PasswordInput } from "@/components/auth/PasswordInput";
import { ResendVerificationForm } from "@/components/auth/ResendVerificationForm";
import { SubmitButton } from "@/components/auth/SubmitButton";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { registerSchema } from "@/lib/validations/auth";

const FIELDS = ["name", "email", "password", "confirmPassword"] as const;

type Field = (typeof FIELDS)[number];

type FieldErrors = Partial<Record<Field, string>>;

/** Set once the account exists — the form is replaced by this. */
interface Registered {
  email: string;
  emailSent: boolean;
}

/** First message per field — a stack of them under one input is just noise. */
function toFieldErrors(error: ZodError): FieldErrors {
  const errors: FieldErrors = {};

  for (const issue of error.issues) {
    const field = issue.path[0];

    if (
      typeof field === "string" &&
      FIELDS.includes(field as Field) &&
      !(field in errors)
    ) {
      errors[field as Field] = issue.message;
    }
  }

  return errors;
}

function FieldError({ message }: { message?: string }) {
  if (!message) return null;

  return <p className="text-xs text-destructive">{message}</p>;
}

/**
 * What replaces the form once the account exists.
 *
 * `emailSent` is reported rather than assumed: the account is created even when
 * the provider rejects the send, and claiming "check your inbox" regardless
 * would leave that person waiting on mail nobody accepted.
 */
function CheckYourEmail({ email, emailSent }: Registered) {
  const Icon = emailSent ? MailCheck : MailWarning;

  return (
    <div className="space-y-4">
      <h2 className="text-base font-semibold">
        {emailSent ? "Check your email" : "Account created"}
      </h2>

      <p className="flex items-start gap-2 text-sm text-muted-foreground">
        <span className={emailSent ? "text-emerald-500" : "text-amber-500"}>
          <Icon className="mt-0.5 size-4 shrink-0" aria-hidden />
        </span>
        {emailSent ? (
          <span>
            We sent a confirmation link to{" "}
            <span className="font-medium text-foreground">{email}</span>. Click
            it to finish setting up your account — the link lasts 24 hours.
          </span>
        ) : (
          <span>
            Your account is ready, but the confirmation email to{" "}
            <span className="font-medium text-foreground">{email}</span> could
            not be sent. Try again below.
          </span>
        )}
      </p>

      <ResendVerificationForm
        defaultEmail={email}
        label={emailSent ? "Resend the link" : "Send the link"}
      />
    </div>
  );
}

/**
 * Posts to `/api/auth/register` rather than going through a Server Action: the
 * caller needs the status code to tell a duplicate email apart from a bad
 * payload, and the route is the same one a future CLI client would use.
 *
 * The same Zod schema runs here and in the route handler, so the common
 * mistakes (mismatched passwords, a malformed email) are caught without a round
 * trip while the server still refuses to trust any of it.
 */
export function RegisterForm() {
  const [registered, setRegistered] = useState<Registered | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setFieldErrors({});

    const formData = new FormData(event.currentTarget);
    const parsed = registerSchema.safeParse({
      name: formData.get("name"),
      email: formData.get("email"),
      password: formData.get("password"),
      confirmPassword: formData.get("confirmPassword"),
    });

    if (!parsed.success) {
      setFieldErrors(toFieldErrors(parsed.error));
      return;
    }

    setPending(true);

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed.data),
      });

      const result = await response.json();

      if (!response.ok) {
        setError(result?.error ?? "Could not create the account");
        setPending(false);
        return;
      }

      // No redirect to sign-in: signing in is blocked until the address is
      // confirmed, so sending them to a form they cannot use would be a dead
      // end. The form is replaced in place by what to do next instead.
      setRegistered({
        email: parsed.data.email,
        emailSent: result?.data?.emailSent !== false,
      });
      setPending(false);
    } catch {
      setError("Could not reach the server. Please try again.");
      setPending(false);
    }
  }

  if (registered) {
    return <CheckYourEmail {...registered} />;
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-3">
      <FormError message={error} />

      <div className="space-y-1.5">
        <Label htmlFor="name">Name</Label>
        <Input
          id="name"
          name="name"
          autoComplete="name"
          placeholder="Ada Lovelace"
          className="h-9"
          aria-invalid={Boolean(fieldErrors.name)}
        />
        <FieldError message={fieldErrors.name} />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          placeholder="you@example.com"
          className="h-9"
          aria-invalid={Boolean(fieldErrors.email)}
        />
        <FieldError message={fieldErrors.email} />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="password">Password</Label>
        <PasswordInput
          id="password"
          name="password"
          autoComplete="new-password"
          className="h-9"
          aria-invalid={Boolean(fieldErrors.password)}
        />
        <FieldError message={fieldErrors.password} />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="confirmPassword">Confirm password</Label>
        <PasswordInput
          id="confirmPassword"
          name="confirmPassword"
          autoComplete="new-password"
          className="h-9"
          aria-invalid={Boolean(fieldErrors.confirmPassword)}
        />
        <FieldError message={fieldErrors.confirmPassword} />
      </div>

      <SubmitButton pending={pending} size="lg" className="w-full">
        Create account
      </SubmitButton>
    </form>
  );
}
