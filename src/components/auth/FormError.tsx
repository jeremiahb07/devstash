import { CircleAlert } from "lucide-react";

/**
 * A form-level failure — a rejected sign-in, a duplicate email. Field-level
 * validation messages sit under their input instead.
 *
 * `role="alert"` so a screen reader announces it when it appears; the element
 * is absent rather than empty when there is nothing to say, which is what makes
 * the announcement fire.
 */
export function FormError({ message }: { message?: string | null }) {
  if (!message) return null;

  return (
    <p
      role="alert"
      className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
    >
      <CircleAlert className="mt-0.5 size-4 shrink-0" aria-hidden />
      {message}
    </p>
  );
}
