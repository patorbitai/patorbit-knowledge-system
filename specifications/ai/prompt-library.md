# Prompt Library

## Purpose

This document catalogs all prompt templates used by the Patorbit AI platform, organized by capability.

## Scope

This document covers all prompt categories used across AI features.

---

## Prompt Categories

### Resume Generation

| Prompt                       | Purpose                          |
| ---------------------------- | -------------------------------- |
| `resume/generate/summary`    | Generate a professional summary  |
| `resume/generate/experience` | Generate experience descriptions |
| `resume/generate/skills`     | Generate skills section          |
| `resume/generate/education`  | Generate education section       |
| `resume/generate/objective`  | Generate career objective        |
| `resume/optimize/ats`        | Optimize resume for ATS parsing  |
| `resume/optimize/keywords`   | Suggest target keywords          |

### Resume Review

| Prompt                   | Purpose                     |
| ------------------------ | --------------------------- |
| `resume/review/strength` | Identify resume strengths   |
| `resume/review/weakness` | Identify resume weaknesses  |
| `resume/review/gaps`     | Identify gaps in experience |
| `resume/review/bias`     | Detect potential bias       |

### Career Passport

| Prompt                          | Purpose                       |
| ------------------------------- | ----------------------------- |
| `passport/generate/summary`     | Generate passport overview    |
| `passport/analyze/completeness` | Analyze passport completeness |
| `passport/suggest/claims`       | Suggest missing claims        |

### Claim Analysis

| Prompt                      | Purpose                       |
| --------------------------- | ----------------------------- |
| `claim/analyze/consistency` | Check claim consistency       |
| `claim/analyze/relevance`   | Assess claim relevance        |
| `claim/extract/document`    | Extract claims from documents |

### Evidence Analysis

| Prompt                        | Purpose                      |
| ----------------------------- | ---------------------------- |
| `evidence/analyze/document`   | Analyze an evidence document |
| `evidence/verify/consistency` | Check evidence consistency   |
| `evidence/suggest/next`       | Suggest additional evidence  |

### Skills

| Prompt                       | Purpose                          |
| ---------------------------- | -------------------------------- |
| `skills/extract/document`    | Extract skills from documents    |
| `skills/extract/resume`      | Extract skills from resumes      |
| `skills/suggest/missing`     | Suggest missing skills           |
| `skills/analyze/proficiency` | Analyze skill proficiency levels |

### Career Recommendations

| Prompt                    | Purpose                     |
| ------------------------- | --------------------------- |
| `career/recommend/roles`  | Suggest career roles        |
| `career/recommend/skills` | Recommend skills to develop |
| `career/recommend/path`   | Suggest career paths        |
| `career/analyze/market`   | Analyze market trends       |

### Recruiter Analysis

| Prompt                        | Purpose                     |
| ----------------------------- | --------------------------- |
| `recruiter/match/score`       | Score candidate-job match   |
| `recruiter/analyze/profile`   | Analyze candidate profile   |
| `recruiter/summarize/profile` | Summarize candidate profile |

### Knowledge Graph

| Prompt                      | Purpose                     |
| --------------------------- | --------------------------- |
| `knowledge/link/skills`     | Link skills to claims       |
| `knowledge/suggest/edges`   | Suggest graph relationships |
| `knowledge/analyze/cluster` | Analyze skill clusters      |

### Classification

| Prompt                      | Purpose                   |
| --------------------------- | ------------------------- |
| `classify/claim/type`       | Classify claim type       |
| `classify/experience/level` | Classify experience level |
| `classify/industry`         | Classify industry         |

### Extraction

| Prompt                       | Purpose                   |
| ---------------------------- | ------------------------- |
| `extract/contact/info`       | Extract contact info      |
| `extract/employment/history` | Extract work history      |
| `extract/education/history`  | Extract education history |
| `extract/certifications`     | Extract certifications    |
| `extract/projects`           | Extract project details   |

### Summarization

| Prompt                        | Purpose                           |
| ----------------------------- | --------------------------------- |
| `summarize/resume/target`     | Summarize for a target role       |
| `summarize/candidate/profile` | Summarize candidate for recruiter |
| `summarize/document/upload`   | Summarize uploaded document       |

## Prompt Registry

Each prompt template is registered in the prompt registry with:

- **ID**: Unique identifier (`resume/generate/summary`)
- **Version**: Current version number
- **Model**: Recommended model capability
- **Max Tokens**: Output token limit
- **Temperature**: Recommended temperature setting

## References

- [Prompt Architecture](prompt-architecture.md): Prompt composition.
- [Prompt Versioning](prompt-versioning.md): Version lifecycle.
