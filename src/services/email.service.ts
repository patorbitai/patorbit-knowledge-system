import { Resend } from "resend";

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

    const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Verify your Patorbit account</title>
</head>
<body style="font-family: Arial, sans-serif; background-color: #f6f9fc; padding: 20px; color: #333;">
  <div style="max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 8px; padding: 40px; box-shadow: 0 4px 6px rgba(0,0,0,0.05);">
    <h2 style="color: #4f46e5; margin-top: 0;">Patorbit</h2>
    <h3>Verify your Patorbit account</h3>
    <p>Hello,</p>
    <p>Thank you for registering with Patorbit (${email}). Please verify your email address by clicking the button below:</p>
    <div style="text-align: center; margin: 30px 0;">
      <a href="${verificationUrl}" style="background-color: #4f46e5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">Verify Email Address</a>
    </div>
    <p>Or copy and paste this link into your browser:</p>
    <p style="word-break: break-all; color: #6b7280; font-size: 14px;">${verificationUrl}</p>
    <p>This verification link will expire in 24 hours.</p>
    <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
    <p style="color: #9ca3af; font-size: 12px; text-align: center;">Patorbit Knowledge System. If you did not create an account, you can safely ignore this email.</p>
  </div>
</body>
</html>`;

    const text = `Verify your Patorbit account\n\nHello,\n\nThank you for registering with Patorbit (${email}). Please verify your email address by visiting the link below:\n\n${verificationUrl}\n\nThis verification link will expire in 24 hours.\n\nIf you did not create an account, you can safely ignore this email.\n\n— Patorbit Knowledge System`;

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

    const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Reset your Patorbit password</title>
</head>
<body style="font-family: Arial, sans-serif; background-color: #f6f9fc; padding: 20px; color: #333;">
  <div style="max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 8px; padding: 40px; box-shadow: 0 4px 6px rgba(0,0,0,0.05);">
    <h2 style="color: #4f46e5; margin-top: 0;">Patorbit</h2>
    <h3>Reset your Patorbit password</h3>
    <p>Hello,</p>
    <p>We received a request to reset the password for your Patorbit account. You can reset your password by clicking the button below:</p>
    <div style="text-align: center; margin: 30px 0;">
      <a href="${resetUrl}" style="background-color: #4f46e5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">Reset Password</a>
    </div>
    <p>Or copy and paste this link into your browser:</p>
    <p style="word-break: break-all; color: #6b7280; font-size: 14px;">${resetUrl}</p>
    <p>This password reset link will expire in 1 hour.</p>
    <div style="background-color: #fef2f2; border: 1px solid #fecaca; border-radius: 6px; padding: 15px; margin-top: 20px; color: #991b1b; font-size: 14px;">
      <strong>Security Warning:</strong> If you did not request a password reset, please ignore this email. Your password will remain unchanged.
    </div>
    <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
    <p style="color: #9ca3af; font-size: 12px; text-align: center;">Patorbit Knowledge System.</p>
  </div>
</body>
</html>`;

    const text = `Reset your Patorbit password\n\nHello,\n\nWe received a request to reset the password for your Patorbit account. You can reset your password by visiting the link below:\n\n${resetUrl}\n\nThis password reset link will expire in 1 hour.\n\nSECURITY WARNING: If you did not request a password reset, you can safely ignore this email. Your password will remain unchanged.\n\n— Patorbit Knowledge System`;

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
