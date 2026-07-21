export interface AppConfig {
  name: string;
  version: string;
  port: number;
  env: string;
}

export function createConfig(overrides?: Partial<AppConfig>): AppConfig {
  return {
    name: "patorbit",
    version: "0.1.0",
    port: 4000,
    env: process.env.NODE_ENV ?? "development",
    ...overrides,
  };
}
