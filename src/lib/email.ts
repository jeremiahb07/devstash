import { Resend } from "resend";

/**
 * The Resend account backing this app has no verified domain, so the only
 * sender available is their shared `onboarding@resend.dev` — which delivers
 * *only* to the Resend account owner's own address. Point `EMAIL_FROM` at an
 * address on a verified domain to reach anyone else.
 */
const DEFAULT_FROM = "DevStash <onboarding@resend.dev>";

let client: Resend | null = null;

/**
 * Built on first use rather than at module load: the key is absent in CI and
 * during `next build`, and a missing key should degrade to "could not send"
 * rather than crash the route that imported this.
 */
function getClient() {
  const apiKey = process.env.RESEND_API_KEY;

  if (!apiKey) return null;

  client ??= new Resend(apiKey);

  return client;
}

export interface SendResult {
  sent: boolean;
  /** Present when `sent` is false — for logs, never for the response body. */
  error?: string;
}

interface VerificationEmail {
  to: string;
  name?: string | null;
  url: string;
}

function verificationHtml({ name, url }: Omit<VerificationEmail, "to">) {
  const greeting = name ? `Hi ${name},` : "Hi,";

  // Inline styles and a table-free single column: every rule that matters has
  // to survive clients that strip <style> blocks.
  return `<!doctype html>
<html>
  <body style="margin:0;padding:24px;background:#f6f6f7;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;color:#18181b;">
    <div style="max-width:480px;margin:0 auto;background:#ffffff;border:1px solid #e4e4e7;border-radius:12px;padding:32px;">
      <h1 style="margin:0 0 16px;font-size:20px;font-weight:600;">Confirm your email</h1>
      <p style="margin:0 0 12px;font-size:15px;line-height:1.6;">${greeting}</p>
      <p style="margin:0 0 24px;font-size:15px;line-height:1.6;">
        Confirm this address to finish setting up your DevStash account.
      </p>
      <a href="${url}" style="display:inline-block;padding:12px 20px;background:#18181b;color:#ffffff;text-decoration:none;border-radius:8px;font-size:15px;font-weight:500;">
        Verify email
      </a>
      <p style="margin:24px 0 0;font-size:13px;line-height:1.6;color:#71717a;">
        This link expires in 24 hours. If the button does not work, paste this
        into your browser:
      </p>
      <p style="margin:8px 0 0;font-size:13px;line-height:1.6;word-break:break-all;color:#71717a;">${url}</p>
      <p style="margin:24px 0 0;font-size:13px;line-height:1.6;color:#71717a;">
        If you did not sign up for DevStash, you can ignore this email.
      </p>
    </div>
  </body>
</html>`;
}

function verificationText({ name, url }: Omit<VerificationEmail, "to">) {
  return [
    name ? `Hi ${name},` : "Hi,",
    "",
    "Confirm this address to finish setting up your DevStash account:",
    url,
    "",
    "This link expires in 24 hours.",
    "If you did not sign up for DevStash, you can ignore this email.",
  ].join("\n");
}

/**
 * Sends the verification link. Never throws — callers treat a failed send as a
 * state to report ("we could not email you, try resending"), not as a reason to
 * fail the operation that triggered it.
 */
export async function sendVerificationEmail({
  to,
  name,
  url,
}: VerificationEmail): Promise<SendResult> {
  // Without a deliverable sender, the link is the only way to finish the flow
  // locally — so put it where a developer can actually reach it.
  if (process.env.NODE_ENV !== "production") {
    console.info(`[email] verification link for ${to}: ${url}`);
  }

  const resend = getClient();

  if (!resend) return { sent: false, error: "RESEND_API_KEY is not set" };

  try {
    const { error } = await resend.emails.send({
      from: process.env.EMAIL_FROM || DEFAULT_FROM,
      to,
      subject: "Confirm your DevStash email",
      html: verificationHtml({ name, url }),
      text: verificationText({ name, url }),
    });

    if (error) {
      console.error("Failed to send verification email:", error);

      return { sent: false, error: error.message };
    }

    return { sent: true };
  } catch (error) {
    console.error("Failed to send verification email:", error);

    return { sent: false, error: "Email provider request failed" };
  }
}
