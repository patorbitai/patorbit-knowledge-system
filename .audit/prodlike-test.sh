#!/usr/bin/env bash
# Simulates an existing production database (created with `prisma db push`,
# carrying real rows, with migration history baselined) and proves that the
# V18 migration applies on top of it without touching existing data.
set -uo pipefail
cd "$(dirname "$0")/.."

PSQL="/c/Program Files/PostgreSQL/18/bin/psql"
DB="patorbit_prodlike"
URL="postgresql://postgres@127.0.0.1:5433/${DB}?schema=public"

q() { "$PSQL" -h 127.0.0.1 -U postgres -p 5433 -d "$DB" -t -A -c "$1" | tr -d '\r'; }

echo "== 1. create a production-like database from the schema (db push, simulation only) =="
"$PSQL" -h 127.0.0.1 -U postgres -p 5433 -q -c "DROP DATABASE IF EXISTS \"$DB\"" -c "CREATE DATABASE \"$DB\""
DATABASE_URL="$URL" node node_modules/prisma/build/index.js db push --skip-generate >/dev/null 2>&1 || { echo "db push failed"; exit 1; }

echo "== 2. insert production-like rows =="
"$PSQL" -h 127.0.0.1 -U postgres -p 5433 -d "$DB" -q -v ON_ERROR_STOP=1 <<'SQL'
INSERT INTO "User" (id, email, name, "passwordHash", "emailVerified", "createdAt", "updatedAt")
VALUES ('u_prod_1', 'prod1@example.com', 'Prod One', 'hash1', now(), now(), now()),
       ('u_prod_2', 'prod2@example.com', 'Prod Two', 'hash2', now(), now(), now());

INSERT INTO "ProfessionalIdentity" (id, "userId", "createdAt", "updatedAt")
VALUES ('pi_prod_1', 'u_prod_1', now(), now()),
       ('pi_prod_2', 'u_prod_2', now(), now());

INSERT INTO "Claim" (id, "professionalIdentityId", "assertionText", "claimType", "createdAt", "updatedAt")
VALUES ('claim_prod_1', 'pi_prod_1', 'Led the data platform migration', 'experience', now(), now());

INSERT INTO "EvidenceRecord" (id, "userId", "claimId", "evidenceType", "evidenceKind", content, format, metadata, status, confidence, "createdAt", "updatedAt")
VALUES ('ev_prod_1', 'u_prod_1', 'claim_prod_1', 'document', 'artifact', 'Signed migration plan', 'pdf', '{}', 'active', 0.9, now(), now());

INSERT INTO "UsageRecord" (id, "userId", feature, period, count, "updatedAt")
VALUES ('ur_prod_1', 'u_prod_1', 'resume_tailor', '2026-11', 7, now());

INSERT INTO "Subscription" (id, "userId", "razorpaySubscriptionId", "razorpayPlanId", tier, status, interval, "createdAt", "updatedAt")
VALUES ('sub_prod_1', 'u_prod_1', 'sub_razor_1', 'plan_1', 'professional', 'active', 'monthly', now(), now());

INSERT INTO "Resume" (id, "professionalIdentityId", "resumeId", "resumeName", "templateId", payload, "createdAt", "updatedAt")
VALUES ('res_prod_1', 'pi_prod_1', 'r-1', 'Main resume', 'classic', '{}', now(), now());
SQL

BEFORE=$(q 'select (select count(*) from "User")||(select count(*) from "ProfessionalIdentity")||(select count(*) from "Claim")||(select count(*) from "EvidenceRecord")||(select count(*) from "UsageRecord")||(select count(*) from "Subscription")||(select count(*) from "Resume")')
echo "row fingerprint before: $BEFORE"

echo "== 3. repair migration must be idempotent on an already-correct database =="
"$PSQL" -h 127.0.0.1 -U postgres -p 5433 -d "$DB" -q -v ON_ERROR_STOP=1 -f prisma/migrations/20260907005000_repair_missing_core_tables/migration.sql && echo "repair pass 1 ok"
"$PSQL" -h 127.0.0.1 -U postgres -p 5433 -d "$DB" -q -v ON_ERROR_STOP=1 -f prisma/migrations/20260907005000_repair_missing_core_tables/migration.sql && echo "repair pass 2 ok (idempotent)"

echo "== 4. remove V18 tables to represent production *before* V18 =="
"$PSQL" -h 127.0.0.1 -U postgres -p 5433 -d "$DB" -q -v ON_ERROR_STOP=1 -c '
DROP TABLE IF EXISTS "InterviewEmailConnection", "SavedPracticeQuestion", "PracticeSession",
  "PreparationPlan", "InterviewRound", "InterviewEmail", "InterviewProfile" CASCADE;'

echo "== 5. baseline every migration that predates V18 =="
for dir in prisma/migrations/*/; do
  name=$(basename "$dir")
  [ "$name" = "20261126000000_add_interview_preparation" ] && continue
  DATABASE_URL="$URL" node node_modules/prisma/build/index.js migrate resolve --applied "$name" >/dev/null 2>&1 || { echo "baseline failed: $name"; exit 1; }
done
echo "baselined $(q 'select count(*) from "_prisma_migrations"') migrations"

echo "== 6. deploy the V18 migration on top of existing data =="
DATABASE_URL="$URL" node node_modules/prisma/build/index.js migrate deploy 2>&1 | grep -E "Applying|successfully|Error|error" | tail -5
DEPLOY=${PIPESTATUS[0]}

AFTER=$(q 'select (select count(*) from "User")||(select count(*) from "ProfessionalIdentity")||(select count(*) from "Claim")||(select count(*) from "EvidenceRecord")||(select count(*) from "UsageRecord")||(select count(*) from "Subscription")||(select count(*) from "Resume")')
echo "row fingerprint after:  $AFTER"
[ "$BEFORE" = "$AFTER" ] && echo "DATA PRESERVED" || echo "DATA CHANGED -- FAIL"

echo "V18 tables present: $(q "select count(*) from information_schema.tables where table_schema='public' and table_name like 'Interview%' or table_name in ('PreparationPlan','PracticeSession','SavedPracticeQuestion');")"
echo "applied migrations: $(q 'select count(*) from "_prisma_migrations" where finished_at is not null and rolled_back_at is null;')"

echo "== 7. schema drift check against the deployed database =="
node node_modules/prisma/build/index.js migrate diff --from-url "$URL" --to-schema-datamodel prisma/schema.prisma --script --exit-code >/dev/null 2>&1
echo "drift exit (0 = none): $?"
exit $DEPLOY
