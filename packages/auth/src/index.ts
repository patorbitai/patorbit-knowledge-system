// Auth Package
// Authentication abstraction layer
// Provides interfaces and base infrastructure for authentication
// Concrete implementations will be added when auth flows are built

export interface AuthProvider {
  name: string;
  authenticate(token: string): Promise<AuthSession | null>;
  validate(session: AuthSession): Promise<boolean>;
}

export interface AuthSession {
  userId: string;
  email: string;
  roles: string[];
  expiresAt: Date;
}

export type AuthConfig = {
  providers: AuthProvider[];
  sessionDuration: number; // in seconds
};
