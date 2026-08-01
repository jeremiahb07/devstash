"use client";

import { useActionState } from "react";
import { CircleCheck, CircleAlert } from "lucide-react";

import {
  resendVerificationEmail,
  type ResendVerificationState,
} from "@/actions/auth";
import { SubmitButton } from "@/components/auth/SubmitButton";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const INITIAL: ResendVerificationState = { message: null, ok: false };

export interface ResendVerificationFormProps {
  /** Prefilled when the page already knows who is asking. */
  defaultEmail?: string;
  label?: string;
}

/**
 * Requests a fresh verification link.
 *
 * The address is always an editable field rather than a hidden one: the link
 * commonly gets opened on a different device from the one that registered, so
 * the page asking for a resend often has no idea whose address it is.
 */
export function ResendVerificationForm({
  defaultEmail,
  label = "Send another link",
}: ResendVerificationFormProps) {
  const [state, formAction] = useActionState(resendVerificationEmail, INITIAL);

  const Icon = state.ok ? CircleCheck : CircleAlert;

  return (
    <form action={formAction} className="space-y-3">
      <div className="space-y-1.5">
        <Label htmlFor="resend-email">Email</Label>
        <Input
          id="resend-email"
          name="email"
          type="email"
          autoComplete="email"
          placeholder="you@example.com"
          className="h-9"
          defaultValue={defaultEmail}
          required
        />
      </div>

      {state.message && (
        <p
          role="status"
          className={`flex items-start gap-2 text-sm ${
            state.ok ? "text-muted-foreground" : "text-destructive"
          }`}
        >
          <Icon className="mt-0.5 size-4 shrink-0" aria-hidden />
          {state.message}
        </p>
      )}

      <SubmitButton variant="outline" size="lg" className="w-full">
        {label}
      </SubmitButton>
    </form>
  );
}
