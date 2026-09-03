-- C35 corrective migration: existing users must have onboardingCompleted = true
-- The original C35 migration set DEFAULT false, which incorrectly marks existing users as incomplete.
UPDATE "ProfessionalIdentity" SET "onboardingCompleted" = true WHERE "onboardingCompleted" = false;
