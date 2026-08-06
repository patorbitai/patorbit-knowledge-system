export type IdentityScoreData = {
  score: number;
  resumeCompleteness: number;
  verifiedCredentials: number;
  passportClaims: number;
  aiUsed: boolean;
};

// TODO: replace with real calculation from Prisma once backend data exists
export async function getIdentityScore(_userId?: string): Promise<IdentityScoreData> {
  return {
    score: 0,
    resumeCompleteness: 0,
    verifiedCredentials: 0,
    passportClaims: 0,
    aiUsed: false,
  };
}
