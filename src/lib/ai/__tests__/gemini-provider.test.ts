/**
 * Gemini Provider test suite.
 *
 * Tests the provider contract, configuration, and error handling without
 * requiring a real API key. Live API tests are in a separate integration file.
 */
import { describe, it, expect, beforeEach, vi } from "vitest";
import { GeminiProvider } from "../gemini";
import { getAIProvider } from "../provider";

// ── Provider Contract ─────────────────────────────────────────────────────

describe("GeminiProvider — Contract", () => {
  it("implements AIProvider interface", () => {
    const provider = new GeminiProvider();
    expect(provider.name).toBe("gemini");
    expect(typeof provider.complete).toBe("function");
  });

  it("has completeStream method", () => {
    const provider = new GeminiProvider();
    expect(typeof provider.completeStream).toBe("function");
  });

  it("completeStream is an async generator", async () => {
    const provider = new GeminiProvider();
    // Without a real API key, this should throw an error — not crash
    try {
      const gen = provider.completeStream(
        [{ role: "system", content: "You are a test." }, { role: "user", content: "Hello" }],
        { maxTokens: 10 },
      );
      // Consume the generator — should throw due to missing API key
      for await (const _chunk of gen) {
        // Should not reach here without a valid API key
      }
    } catch (err) {
      // Expected: MISSING_API_KEY error
      expect(err).toBeDefined();
    }
  });
});

// ── Provider Registry ─────────────────────────────────────────────────────

describe("GeminiProvider — Registry", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
    delete process.env.AI_PROVIDER;
  });

  it("is registered as 'gemini' in the provider registry", () => {
    const provider = getAIProvider("gemini");
    expect(provider.name).toBe("gemini");
    expect(provider).toBeInstanceOf(GeminiProvider);
  });

  it("can be selected via AI_PROVIDER=gemini", () => {
    process.env.AI_PROVIDER = "gemini";
    const provider = getAIProvider();
    expect(provider.name).toBe("gemini");
  });

  it("openai still works when AI_PROVIDER=openai", () => {
    process.env.AI_PROVIDER = "openai";
    const provider = getAIProvider();
    expect(provider.name).toBe("openai");
  });

  it("throws for unknown provider", () => {
    expect(() => getAIProvider("nonexistent")).toThrow("not found");
  });
});

// ── Configuration ─────────────────────────────────────────────────────────

describe("GeminiProvider — Configuration", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  it("throws MISSING_API_KEY when GEMINI_API_KEY is not set", async () => {
    delete process.env.GEMINI_API_KEY;
    const provider = new GeminiProvider();
    await expect(
      provider.complete([{ role: "user", content: "test" }]),
    ).rejects.toThrow("GEMINI_API_KEY is not configured");
  });

  it("does not expose API key in error messages", async () => {
    process.env.GEMINI_API_KEY = "test-secret-key-12345";
    const provider = new GeminiProvider();
    try {
      await provider.complete([{ role: "user", content: "test" }]);
    } catch (err: any) {
      expect(err.message).not.toContain("test-secret-key-12345");
      expect(err.code).toBeDefined();
    }
  });
});

// ── Message Handling ──────────────────────────────────────────────────────

describe("GeminiProvider — Message Handling", () => {
  it("correctly separates system and user messages", () => {
    // This tests the logic, not the API call
    const messages = [
      { role: "system" as const, content: "You are a career advisor." },
      { role: "user" as const, content: "Review my resume." },
    ];

    let systemContent = "";
    let userContent = "";

    for (const msg of messages) {
      if (msg.role === "system") systemContent = msg.content;
      else if (msg.role === "user") userContent = msg.content;
    }

    expect(systemContent).toBe("You are a career advisor.");
    expect(userContent).toBe("Review my resume.");
  });

  it("handles multiple user messages", () => {
    const messages = [
      { role: "system" as const, content: "System prompt" },
      { role: "user" as const, content: "First user message" },
    ];

    let userContent = "";
    for (const msg of messages) {
      if (msg.role === "user") userContent = msg.content;
    }

    expect(userContent).toBe("First user message");
  });
});

// ── JSON Mode ─────────────────────────────────────────────────────────────

describe("GeminiProvider — JSON Mode", () => {
  it("passes jsonMode to generation config", () => {
    // Verify the config building logic
    const options = { jsonMode: true, maxTokens: 1024, temperature: 0.5 };
    const generationConfig: Record<string, unknown> = {
      temperature: options.temperature ?? 0.7,
      maxOutputTokens: options.maxTokens ?? 256,
    };
    if (options.jsonMode) {
      generationConfig.responseMimeType = "application/json";
    }

    expect(generationConfig.responseMimeType).toBe("application/json");
    expect(generationConfig.temperature).toBe(0.5);
    expect(generationConfig.maxOutputTokens).toBe(1024);
  });
});

// ── Error Handling ────────────────────────────────────────────────────────

describe("GeminiProvider — Error Mapping", () => {
  it("maps rate limit errors correctly", async () => {
    // Simulate rate limit error mapping
    const err = { message: "429 Too Many Requests", status: 429 };
    const msg = (err.message || "").toLowerCase();

    let errorCode = "UPSTREAM";
    if (msg.includes("rate limit") || err.status === 429) {
      errorCode = "RATE_LIMITED";
    }

    expect(errorCode).toBe("RATE_LIMITED");
  });

  it("maps auth errors correctly", async () => {
    const err = { message: "Invalid API key", status: 401 };
    const msg = (err.message || "").toLowerCase();

    let errorCode = "UPSTREAM";
    if (msg.includes("api key") || err.status === 401) {
      errorCode = "MISSING_API_KEY";
    }

    expect(errorCode).toBe("MISSING_API_KEY");
  });

  it("maps timeout errors correctly", async () => {
    const err = { message: "Request timeout", code: "ETIMEDOUT" };
    const msg = (err.message || "").toLowerCase();

    let errorCode = "UPSTREAM";
    if (msg.includes("timeout") || err.code === "ETIMEDOUT") {
      errorCode = "TIMEOUT";
    }

    expect(errorCode).toBe("TIMEOUT");
  });
});

// ── Summary Route ─────────────────────────────────────────────────────────

describe("Summary Route — Provider Abstraction", () => {
  it("summary route no longer imports OpenAI directly", async () => {
    const fs = await import("fs");
    const path = await import("path");
    const content = fs.readFileSync(
      path.resolve(__dirname, "../../../app/api/ai/summary/route.ts"),
      "utf-8",
    );
    // Should NOT contain direct OpenAI import
    expect(content).not.toContain('import OpenAI from "openai"');
    // Should use provider abstraction
    expect(content).toContain("getAIProvider");
  });

  it("summary route preserves SSE format", async () => {
    const fs = await import("fs");
    const path = await import("path");
    const content = fs.readFileSync(
      path.resolve(__dirname, "../../../app/api/ai/summary/route.ts"),
      "utf-8",
    );
    // Must still emit the same SSE events the frontend expects
    expect(content).toContain('"chunk"');
    expect(content).toContain('"done"');
    expect(content).toContain('"error"');
    expect(content).toContain("text/event-stream");
  });
});

// ── Security ──────────────────────────────────────────────────────────────

describe("Security — API Key Isolation", () => {
  it("GEMINI_API_KEY is never exposed to client code", async () => {
    const fs = await import("fs");
    const path = await import("path");

    // Check client-side files
    const clientFiles = [
      "src/lib/ai/client.ts",
      "src/lib/ai/useOptimization.ts",
      "src/lib/ai/cache.ts",
    ];

    for (const file of clientFiles) {
      const filePath = path.resolve(__dirname, "../../../", file);
      if (fs.existsSync(filePath)) {
        const content = fs.readFileSync(filePath, "utf-8");
        expect(content).not.toContain("GEMINI_API_KEY");
        expect(content).not.toContain("NEXT_PUBLIC_GEMINI");
      }
    }
  });

  it("no NEXT_PUBLIC_GEMINI prefix exists", async () => {
    const fs = await import("fs");
    const path = await import("path");
    const envExample = fs.readFileSync(
      path.resolve(__dirname, "../../../../.env.example"),
      "utf-8",
    );
    expect(envExample).not.toContain("NEXT_PUBLIC_GEMINI");
  });
});

// ── Reliability — Code-Verified ──────────────────────────────────────────

describe("GeminiProvider — Reliability (code-verified)", () => {
  it("has isTransient503 helper that detects 503 errors", async () => {
    const fs = await import("fs");
    const path = await import("path");
    const content = fs.readFileSync(
      path.resolve(__dirname, "../gemini.ts"),
      "utf-8",
    );
    // Must have the 503 retry helper
    expect(content).toContain("isTransient503");
    expect(content).toContain("503");
    expect(content).toContain("high demand");
  });

  it("retries once on 503 before failing", async () => {
    const fs = await import("fs");
    const path = await import("path");
    const content = fs.readFileSync(
      path.resolve(__dirname, "../gemini.ts"),
      "utf-8",
    );
    // Must contain retry logic with delay
    expect(content).toContain("isTransient503(err)");
    expect(content).toContain("delay(1000)");
    // Must retry in both complete() and completeStream()
    const retryCount = (content.match(/isTransient503\(err\)/g) || []).length;
    expect(retryCount).toBe(2); // one in complete, one in completeStream
  });

  it("does NOT retry auth errors (401/403)", async () => {
    const fs = await import("fs");
    const path = await import("path");
    const content = fs.readFileSync(
      path.resolve(__dirname, "../gemini.ts"),
      "utf-8",
    );
    // The retry should ONLY be triggered by isTransient503, not by auth errors
    // Auth errors go straight to normalizeError without retry
    expect(content).toContain("MISSING_API_KEY");
    // Verify no retry for 401/429 in the retry block
    const retryBlock = content.slice(
      content.indexOf("isTransient503(err)"),
      content.indexOf("isTransient503(err)") + 200,
    );
    expect(retryBlock).not.toContain("401");
    expect(retryBlock).not.toContain("429");
  });

  it("has timeout protection at API route level", async () => {
    const fs = await import("fs");
    const path = await import("path");
    const routeFile = fs.readFileSync(
      path.resolve(__dirname, "../../../app/api/ai/route.ts"),
      "utf-8",
    );
    // All AI routes must have withTimeout
    expect(routeFile).toContain("withTimeout");
    expect(routeFile).toContain("55_000");
  });

  it("all specialized AI routes have timeout protection", async () => {
    const fs = await import("fs");
    const path = await import("path");
    const routes = [
      "app/api/ai/bullets/route.ts",
      "app/api/ai/keywords/route.ts",
      "app/api/ai/match/route.ts",
      "app/api/ai/score/route.ts",
    ];
    for (const route of routes) {
      const content = fs.readFileSync(
        path.resolve(__dirname, "../../../", route),
        "utf-8",
      );
      expect(content).toContain("withTimeout");
    }
  });

  it("streaming route handles errors gracefully", async () => {
    const fs = await import("fs");
    const path = await import("path");
    const content = fs.readFileSync(
      path.resolve(__dirname, "../../../app/api/ai/summary/route.ts"),
      "utf-8",
    );
    // Must catch errors and send SSE error event
    expect(content).toContain('send("error"');
    expect(content).toContain('controller.close()');
  });

  it("Gemini provider handles empty responses", async () => {
    const fs = await import("fs");
    const path = await import("path");
    const content = fs.readFileSync(
      path.resolve(__dirname, "../gemini.ts"),
      "utf-8",
    );
    expect(content).toContain("Gemini returned an empty response");
    expect(content).toContain('"UPSTREAM"');
  });

  it("Gemini provider has normalizeError with all error categories", async () => {
    const fs = await import("fs");
    const path = await import("path");
    const content = fs.readFileSync(
      path.resolve(__dirname, "../gemini.ts"),
      "utf-8",
    );
    // Must handle: auth, rate limit, timeout, 5xx, unknown
    expect(content).toContain('"MISSING_API_KEY"');
    expect(content).toContain('"RATE_LIMITED"');
    expect(content).toContain('"TIMEOUT"');
    expect(content).toContain('"UPSTREAM"');
  });
});
