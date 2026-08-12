"use strict";

import { useEffect } from "react";
import { useResumeBuilder } from "@/store/resume-builder";
import { Passport } from "./Passport";
import type { Resume, Claim, Evidence } from "@/types/resume";

export function PublicPassportView({
  resume,
  evidence,
}: {
  resume: Resume;
  claims: Claim[];
  evidence: Evidence[];
}) {
  useEffect(() => {
    if (resume) {
      useResumeBuilder.setState({ resume, evidence: evidence ?? [] });
    }
  }, [resume, evidence]);

  return <Passport />;
}
