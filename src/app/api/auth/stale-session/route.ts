import { redirect } from "next/navigation";

import { signOut } from "@/auth";
import { getCurrentUser, getCurrentUserId } from "@/lib/db/user";

/** Where someone whose session turns out to be fine is sent back to. */
const SIGNED_IN_HOME = "/dashboard";

/** Where someone who was never signed in goes: no explanation to give. */
const SIGN_IN = "/sign-in";

/** `SessionInvalid` is read by `src/app/(auth)/sign-in/page.tsx`. */
const SIGNED_OUT_DESTINATION = "/sign-in?error=SessionInvalid";

/**
 * `GET /api/auth/stale-session` — clears a session whose user no longer exists.
 *
 * This is a route handler because clearing the cookie is a write: `signOut`
 * stores the expiring cookies through `next/headers`, which a Server Component
 * render cannot do. So `src/app/dashboard/layout.tsx` can detect the problem but
 * only this can fix it, and it redirects here.
 *
 * Being a `GET`, anything can trigger it — a cross-site `<img>` included — so it
 * repeats the check instead of trusting the caller. Someone whose account is
 * still there keeps their session and is sent back to the dashboard, which makes
 * a forced request a no-op rather than a way to sign other people out.
 */
export async function GET() {
  if (await getCurrentUser()) {
    redirect(SIGNED_IN_HOME);
  }

  // Nobody was signed in, so there is nothing to clear and no one to tell they
  // were signed out. Costs no extra work — `getCurrentUser` above resolved this
  // same cached call to decide whether to look the row up at all.
  if (!(await getCurrentUserId())) {
    redirect(SIGN_IN);
  }

  // Redirects, so nothing below runs. The expiring cookies ride along on that
  // response, which is what stops the proxy bouncing /sign-in back to the
  // dashboard on the strength of a cookie that should already be gone.
  await signOut({ redirectTo: SIGNED_OUT_DESTINATION });
}
