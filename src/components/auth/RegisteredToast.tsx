"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

/**
 * Announces a freshly created account once `/sign-in?registered=1` is reached,
 * so the new user is told they can sign in rather than landing on a bare form.
 *
 * Rendered only when the flag is present — mounting is the trigger.
 */
export function RegisteredToast() {
  const router = useRouter();

  useEffect(() => {
    // A fixed id makes this idempotent: React's development double-mount, or any
    // remount, updates the existing toast instead of stacking a second one.
    toast.success("Account created", {
      id: "registered",
      description: "You can now sign in with your email and password.",
    });

    // Drop the flag from the URL so a refresh doesn't announce it again. Read
    // from `location` rather than `useSearchParams` to keep any other params
    // (a `callbackUrl` carried through by the proxy) intact.
    const url = new URL(window.location.href);
    url.searchParams.delete("registered");
    router.replace(`${url.pathname}${url.search}`, { scroll: false });
  }, [router]);

  return null;
}
