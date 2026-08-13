import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { EmailService } from "../email.service";

const mockSend = vi.fn();

vi.mock("resend", () => {
  return {
    Resend: function() {
      return {
        emails: {
          send: mockSend,
        },
      };
    },
  };
});

describe("EmailService (Resend)", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.resetModules();
    process.env = { ...originalEnv };
    mockSend.mockReset();
  });

  afterEach(() => {
    process.env = originalEnv;
    vi.clearAllMocks();
  });

  it("handles missing RESEND_API_KEY gracefully and logs unconfigured message without tokens", async () => {
    delete process.env.RESEND_API_KEY;
    const consoleLogSpy = vi.spyOn(console, "log").mockImplementation(() => {});

    const service = new EmailService();
    const token = "secret-token-12345";
    const url = await service.sendVerificationEmail("user@example.com", token);

    expect(url).toContain(token);
    expect(consoleLogSpy).toHaveBeenCalledWith("[EmailService] Email provider is not configured.");
    expect(mockSend).not.toHaveBeenCalled();

    for (const call of consoleLogSpy.mock.calls) {
      const logText = call.join(" ");
      expect(logText).not.toContain(token);
    }
  });

  it("sends verification email successfully when RESEND_API_KEY is configured", async () => {
    process.env.RESEND_API_KEY = "re_test_key";
    process.env.EMAIL_FROM = "Patorbit <test@resend.dev>";
    mockSend.mockResolvedValueOnce({ data: { id: "msg_123" }, error: null });

    const service = new EmailService();
    const token = "verify-token-xyz";
    await service.sendVerificationEmail("user@example.com", token);

    expect(mockSend).toHaveBeenCalledTimes(1);
    const callArg = mockSend.mock.calls[0][0] as { from: string; to: string[]; subject: string; html: string; text: string };
    expect(callArg.from).toBe("Patorbit <test@resend.dev>");
    expect(callArg.to).toEqual(["user@example.com"]);
    expect(callArg.subject).toBe("Verify your Patorbit account");
    expect(callArg.html).toContain(token);
    expect(callArg.text).toContain(token);
  });

  it("uses default sender when EMAIL_FROM is missing", async () => {
    process.env.RESEND_API_KEY = "re_test_key";
    delete process.env.EMAIL_FROM;
    mockSend.mockResolvedValueOnce({ data: { id: "msg_123" }, error: null });

    const service = new EmailService();
    await service.sendVerificationEmail("user@example.com", "token-abc");

    expect(mockSend).toHaveBeenCalledTimes(1);
    const callArg = mockSend.mock.calls[0][0] as { from: string };
    expect(callArg.from).toBe("Patorbit <onboarding@resend.dev>");
  });

  it("sends password reset email successfully when RESEND_API_KEY is configured", async () => {
    process.env.RESEND_API_KEY = "re_test_key";
    process.env.EMAIL_FROM = "Patorbit <test@resend.dev>";
    mockSend.mockResolvedValueOnce({ data: { id: "msg_456" }, error: null });

    const service = new EmailService();
    const token = "reset-token-xyz";
    await service.sendPasswordResetEmail("user@example.com", token);

    expect(mockSend).toHaveBeenCalledTimes(1);
    const callArg = mockSend.mock.calls[0][0] as { subject: string; html: string; text: string };
    expect(callArg.subject).toBe("Reset your Patorbit password");
    expect(callArg.html).toContain(token);
    expect(callArg.text).toContain(token);
  });

  it("throws controlled error when Resend API returns an error", async () => {
    process.env.RESEND_API_KEY = "re_test_key";
    mockSend.mockResolvedValueOnce({ data: null, error: { message: "Invalid API key" } });

    const service = new EmailService();
    await expect(service.sendVerificationEmail("user@example.com", "token")).rejects.toThrow(
      /Failed to send verification email/
    );
  });

  it("ensures token values are not written to logs", async () => {
    process.env.RESEND_API_KEY = "re_test_key";
    const consoleLogSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    mockSend.mockResolvedValue({ data: { id: "1" }, error: null });

    const service = new EmailService();
    const sensitiveToken = "super-secret-token-999";
    await service.sendVerificationEmail("user@example.com", sensitiveToken);
    await service.sendPasswordResetEmail("user@example.com", sensitiveToken);

    for (const call of [...consoleLogSpy.mock.calls, ...consoleErrorSpy.mock.calls]) {
      const logStr = call.join(" ");
      expect(logStr).not.toContain(sensitiveToken);
    }
  });
});
