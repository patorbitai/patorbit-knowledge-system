export interface FeatureFlag {
  name: string;
  enabled: boolean;
  description?: string;
  metadata?: Record<string, unknown>;
}

export interface FeatureFlagProvider {
  readonly name: string;
  isEnabled(name: string): Promise<boolean> | boolean;
  getAll(): Promise<FeatureFlag[]> | FeatureFlag[];
  set(name: string, enabled: boolean): Promise<void> | void;
  delete(name: string): Promise<void> | void;
}
