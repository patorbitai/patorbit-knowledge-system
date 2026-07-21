import { z } from "zod";

export const envSchema = z.object({
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  LOG_LEVEL: z.enum(["debug", "info", "warn", "error"]).default("info"),
  API_PORT: z.coerce.number().default(4000),
  DATABASE_URL: z.string().url(),
  REDIS_URL: z.string().url().optional(),
});

export type EnvConfig = z.infer<typeof envSchema>;

export function parseEnv(env: Record<string, string | undefined>): EnvConfig {
  const result = envSchema.safeParse(env);
  if (!result.success) {
    console.error("Invalid environment variables:", result.error.flatten().fieldErrors);
    throw new Error("Invalid environment configuration");
  }
  return result.data;
}
