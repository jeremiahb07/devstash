"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { ZodError } from "zod";

import { FormError } from "@/components/auth/FormError";
import { PasswordInput } from "@/components/auth/PasswordInput";
import { SubmitButton } from "@/components/auth/SubmitButton";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { registerSchema } from "@/lib/validations/auth";

const FIELDS = ["name", "email", "password", "confirmPassword"] as const;

type Field = (typeof FIELDS)[number];

type FieldErrors = Partial<Record<Field, string>>;

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
 * Posts to `/api/auth/register` rather than going through a Server Action: the
 * caller needs the status code to tell a duplicate email apart from a bad
 * payload, and the route is the same one a future CLI client would use.
 *
 * The same Zod schema runs here and in the route handler, so the common
 * mistakes (mismatched passwords, a malformed email) are caught without a round
 * trip while the server still refuses to trust any of it.
 */
export function RegisterForm() {
  const router = useRouter();
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

      // Left pending through the navigation so the button can't be pressed
      // twice while the next page loads.
      router.push("/sign-in?registered=1");
    } catch {
      setError("Could not reach the server. Please try again.");
      setPending(false);
    }
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
