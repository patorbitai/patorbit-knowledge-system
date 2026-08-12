export class EmailService {
  async sendVerificationEmail(email: string, token: string): Promise<string> {
    const verificationUrl = `${process.env.NEXTAUTH_URL || "http://localhost:3000"}/verify-email?token=${token}`;

    if (process.env.SMTP_HOST || process.env.RESEND_API_KEY) {
      console.log(`[EmailService] Sending verification email to ${email}: ${verificationUrl}`);
    } else {
      console.log(`[EmailService] (Dev/Test Mode) Verification email for ${email}:\nURL: ${verificationUrl}`);
    }
    return verificationUrl;
  }

  async sendPasswordResetEmail(email: string, token: string): Promise<string> {
    const resetUrl = `${process.env.NEXTAUTH_URL || "http://localhost:3000"}/reset-password?token=${token}`;

    if (process.env.SMTP_HOST || process.env.RESEND_API_KEY) {
      console.log(`[EmailService] Sending password reset email to ${email}: ${resetUrl}`);
    } else {
      console.log(`[EmailService] (Dev/Test Mode) Password reset email for ${email}:\nURL: ${resetUrl}`);
    }
    return resetUrl;
  }
}

export const emailService = new EmailService();
