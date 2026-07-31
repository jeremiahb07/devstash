import { handlers } from "@/auth";

// Auth.js mounts its whole surface — sign-in, callbacks, sign-out, session —
// under this one catch-all route.
export const { GET, POST } = handlers;
