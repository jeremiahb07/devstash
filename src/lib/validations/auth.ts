import { z } from "zod";

/**
 * bcrypt only hashes the first 72 bytes of a password and silently discards the
 * rest, so cap the input rather than let two different long passwords collide.
 */
const MAX_PASSWORD_LENGTH = 72;

const MIN_PASSWORD_LENGTH = 8;

/**
 * Emails are trimmed and lowercased before they are validated, so the same
 * address typed with different capitalisation resolves to one account. Both the
 * register route and the Credentials `authorize` go through this, which is what
 * keeps the lookup key consistent between signing up and signing in.
 */
const email = z
  .string()
  .trim()
  .toLowerCase()
  .pipe(z.email("Enter a valid email address"));

/**
 * What the sign-in form posts. Deliberately lenient on the password: enforcing
 * the length policy here would only tell an attacker what the policy is, and a
 * wrong password fails the hash comparison either way.
 */
export const credentialsSchema = z.object({
  email,
  password: z.string().min(1).max(MAX_PASSWORD_LENGTH),
});

export const registerSchema = z
  .object({
    name: z.string().trim().min(1, "Name is required").max(100),
    email,
    password: z
      .string()
      .min(
        MIN_PASSWORD_LENGTH,
        `Password must be at least ${MIN_PASSWORD_LENGTH} characters`,
      )
      .max(
        MAX_PASSWORD_LENGTH,
        `Password must be at most ${MAX_PASSWORD_LENGTH} characters`,
      ),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });
