"use client";

import { Passport } from "./Passport";
import type { Resume, Claim, Evidence } from "@/types/resume";

export function PublicPassportView({
  resume,
  claims,
  evidence,
}: {
  resume: Resume;
  claims: Claim[];
  evidence: Evidence[];
}) {
  return <Passport resumeProp={resume} claimsProp={claims} evidenceProp={evidence} />;
}
