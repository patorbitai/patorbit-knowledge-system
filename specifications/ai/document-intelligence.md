# Document Intelligence

## Purpose

AI-powered document analysis for resumes, transcripts, certificates, and other career documents.

## Capabilities

- **Resume Parsing**: Extract structured data (skills, experience, education) from uploaded resumes.
- **Document Classification**: Classify uploaded documents by type.
- **Text Extraction**: Extract text from PDFs, images (OCR), and DOCX files.
- **Data Extraction**: Extract key information (dates, titles, companies, skills).

## Processing Pipeline

1. **Upload**: Document uploaded via signed URL.
2. **Preprocessing**: File format detection, OCR if needed.
3. **Extraction**: AI-powered extraction of structured data.
4. **Validation**: Cross-reference extracted data with existing claims.
5. **Suggestion**: Present extracted claims to user for confirmation.

## References

- [Evidence Analysis](evidence-analysis.md): Evidence-specific analysis.
- [RAG Architecture](rag-architecture.md): Document retrieval.
- [Claim Analysis](claim-analysis.md): Claim extraction.
