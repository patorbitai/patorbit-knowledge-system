# M7A test fixtures — TEST DATA ONLY

Static, recorded-**shape** payloads for the four official M7A sources.
These are **not real job listings** and must never be displayed to users or
cited as production data. Tests must never call live job APIs.

Coverage per fixture:

| Fixture | Rows |
|---|---|
| `greenhouse-jobs.json` | normal (HTML content, first_published + updated_at, tracking params in URL), remote location, missing identifier (skipped), non-HTTPS URL (skipped) |
| `greenhouse-jobs-after-removal.json` | the same feed with job `900001` no longer listed — closure represented as feed absence |
| `lever-postings.json` | normal (descriptionPlain + applyUrl), remote via workplaceType, **duplicate id** (repeat sighting), missing id (skipped), non-HTTPS URL (skipped), non-object row (skipped) |
| `ashby-jobs.json` | normal + multiple secondary locations (one malformed entry), remote via isRemote, missing id (skipped), missing URLs (skipped), numeric id + no date (postedAt null) |
| `arbeitnow-feed.json` | normal (epoch-seconds date), remote with empty location (ISO date), missing date, **hostile description** (script injection), missing title/slug/company/HTTPS (all skipped) |
