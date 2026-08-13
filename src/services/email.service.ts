import { Resend } from "resend";

function renderEmailLayout({
  headline,
  bodyContent,
  ctaText,
  ctaUrl,
  supportingText,
  securityText,
  fallbackUrl,
}: {
  headline: string;
  bodyContent: string;
  ctaText: string;
  ctaUrl: string;
  supportingText: string;
  securityText: string;
  fallbackUrl: string;
}): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${headline}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f4f6f8; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1e293b;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #f4f6f8; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width: 600px; width: 100%;">
          <!-- Brand Header -->
          <tr>
            <td align="center" style="padding-bottom: 32px;">
              <span style="font-size: 20px; font-weight: 700; letter-spacing: -0.5px; color: #0f172a; text-decoration: none;">Patorbit</span>
            </td>
          </tr>
          <!-- Main Card -->
          <tr>
            <td style="background-color: #ffffff; border-radius: 12px; border: 1px solid #e2e8f0; padding: 48px 40px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.02), 0 2px 4px -2px rgba(0, 0, 0, 0.02);">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                <tr>
                  <td>
                    <h1 style="margin: 0 0 24px 0; font-size: 24px; font-weight: 600; line-height: 32px; color: #0f172a; letter-spacing: -0.5px;">${headline}</h1>
                    <div style="font-size: 16px; line-height: 24px; color: #475569; margin-bottom: 32px;">
                      ${bodyContent}
                    </div>
                    <!-- Primary CTA Button -->
                    <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin-bottom: 32px;">
                      <tr>
                        <td align="center" style="border-radius: 8px; background-color: #0f172a;">
                          <a href="${ctaUrl}" target="_blank" style="font-size: 15px; font-weight: 600; color: #ffffff; text-decoration: none; padding: 14px 28px; border-radius: 8px; border: 1px solid #0f172a; display: inline-block;">
                            ${ctaText}
                          </a>
                        </td>
                      </tr>
                    </table>
                    <p style="margin: 0 0 32px 0; font-size: 14px; line-height: 20px; color: #64748b;">
                      ${supportingText}
                    </p>
                    <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 32px 0;">
                    <!-- Security / Ignore Section -->
                    <p style="margin: 0 0 16px 0; font-size: 14px; line-height: 20px; color: #64748b;">
                      ${securityText}
                    </p>
                    <!-- Fallback URL Section -->
                    <p style="margin: 24px 0 0 0; font-size: 12px; line-height: 18px; color: #94a3b8;">
                      If the button above doesn't work, copy and paste this link into your browser:<br>
                      <span style="color: #64748b; word-break: break-all;">${fallbackUrl}</span>
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td align="center" style="padding-top: 32px;">
              <p style="margin: 0 0 8px 0; font-size: 13px; font-weight: 600; color: #0f172a;">Patorbit</p>
              <p style="margin: 0; font-size: 12px; line-height: 16px; color: #64748b;">Your professional identity, built to last.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

export class EmailService {
  private getResendClient(): Resend | null {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      return null;
    }
    return new Resend(apiKey);
  }

  async sendVerificationEmail(email: string, token: string): Promise<string> {
    const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";
    const verificationUrl = `${baseUrl}/verify-email?token=${token}`;
    const resend = this.getResendClient();

    if (!resend) {
      console.log("[EmailService] Email provider is not configured.");
      return verificationUrl;
    }

    const from = process.env.EMAIL_FROM || "Patorbit <onboarding@resend.dev>";
    const html = renderEmailLayout({
      headline: "Verify your email address",
      bodyContent: "Welcome to Patorbit.<br><br>You're one step away from building your verified professional identity.",
      ctaText: "Verify My Email",
      ctaUrl: verificationUrl,
      supportingText: "This verification link expires in 24 hours.",
      securityText: "If you didn't create a Patorbit account, you can safely ignore this email.",
      fallbackUrl: verificationUrl,
    });

    const text = `Verify your email address\n\nWelcome to Patorbit.\n\nYou're one step away from building your verified professional identity.\n\nVerify your email address by visiting the link below:\n${verificationUrl}\n\nThis verification link expires in 24 hours.\n\nIf you didn't create a Patorbit account, you can safely ignore this email.\n\n— Patorbit\nYour professional identity, built to last.`;

    try {
      const response = await resend.emails.send({
        from,
        to: [email],
        subject: "Verify your Patorbit account",
        html,
        text,
      });

      if (response.error) {
        console.error("[EmailService] Resend API error during verification email delivery:", {
          error: response.error.message,
          name: response.error.name,
        });
        throw new Error(`Failed to send verification email: ${response.error.message}`);
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Unknown error";
      console.error("[EmailService] Exception during verification email delivery:", { message });
      throw new Error(`Failed to send verification email: ${message}`);
    }

    return verificationUrl;
  }

  async sendPasswordResetEmail(email: string, token: string): Promise<string> {
    const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";
    const resetUrl = `${baseUrl}/reset-password?token=${token}`;
    const resend = this.getResendClient();

    if (!resend) {
      console.log("[EmailService] Email provider is not configured.");
      return resetUrl;
    }

    const from = process.env.EMAIL_FROM || "Patorbit <onboarding@resend.dev>";
    const html = renderEmailLayout({
      headline: "Reset your password",
      bodyContent: "Hello,<br><br>We received a request to reset the password for your Patorbit account.",
      ctaText: "Reset Password",
      ctaUrl: resetUrl,
      supportingText: "This secure link will expire in 1 hour.",
      securityText: "Didn't request a password reset?<br><br>You can safely ignore this email. Your password will remain unchanged.",
      fallbackUrl: resetUrl,
    });

    const text = `Reset your password\n\nHello,\n\nWe received a request to reset the password for your Patorbit account.\n\nReset your password by visiting the link below:\n${resetUrl}\n\nThis secure link will expire in 1 hour.\n\nDidn't request a password reset? You can safely ignore this email. Your password will remain unchanged.\n\n— Patorbit\nYour professional identity, built to last.`;

    try {
      const response = await resend.emails.send({
        from,
        to: [email],
        subject: "Reset your Patorbit password",
        html,
        text,
      });

      if (response.error) {
        console.error("[EmailService] Resend API error during password reset email delivery:", {
          error: response.error.message,
          name: response.error.name,
        });
        throw new Error(`Failed to send password reset email: ${response.error.message}`);
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Unknown error";
      console.error("[EmailService] Exception during password reset email delivery:", { message });
      throw new Error(`Failed to send password reset email: ${message}`);
    }

    return resetUrl;
  }
}

export const emailService = new EmailService();
