import { describe, it, expect } from "vitest";
import { readFileSync } from "fs";
import { join } from "path";
import { rawToResume, withIds } from "../resume-parser";
import { parseResumeJson } from "../resume-schema";
import { extractPageText, type PdfTextItem } from "../pdf-extract";

/**
 * End-to-end import test using Arvind's ACTUAL PDF resume.
 * Tests the real pipeline: PDF → text extraction → rawToResume → parseResumeJson
 */
describe("Arvind PDF end-to-end import", () => {
  const PDF_PATH = join("D:\\Resume", "ARVIND ABHAY NARAYAN CHAUHAN.pdf");

  it("extracts text from the real PDF", async () => {
    const buffer = readFileSync(PDF_PATH);
    const arrayBuffer = buffer.buffer.slice(
      buffer.byteOffset,
      buffer.byteOffset + buffer.byteLength
    );

    const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");
    const pdfjsWorker = await import("pdfjs-dist/legacy/build/pdf.worker.mjs");
    (globalThis as any).pdfjsWorker = pdfjsWorker;

    const loadingTask = pdfjs.getDocument({
      data: new Uint8Array(arrayBuffer),
      useWorkerFetch: false,
      isEvalSupported: false,
      useSystemFonts: true,
    });
    const doc = await loadingTask.promise;

    let fullText = "";
    const pageTexts: string[] = [];

    for (let i = 1; i <= doc.numPages; i++) {
      const page = await doc.getPage(i);
      const content = (await page.getTextContent({
        includeMarkedContent: false,
      })) as any;
      const pageText = extractPageText(content.items as PdfTextItem[]);
      pageTexts.push(pageText);
      fullText += pageText;
      page.cleanup();
    }

    console.log(`\n=== PDF EXTRACTION ===`);
    console.log(`Pages: ${doc.numPages}`);
    console.log(`Total chars: ${fullText.length}`);
    console.log(`\n=== RAW TEXT (first 2000 chars) ===`);
    console.log(fullText.substring(0, 2000));

    expect(fullText.length).toBeGreaterThan(100);
    expect(doc.numPages).toBeGreaterThanOrEqual(1);
  });

  it("parses the real PDF text into a correct resume", async () => {
    const buffer = readFileSync(PDF_PATH);
    const arrayBuffer = buffer.buffer.slice(
      buffer.byteOffset,
      buffer.byteOffset + buffer.byteLength
    );

    const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");
    const pdfjsWorker = await import("pdfjs-dist/legacy/build/pdf.worker.mjs");
    (globalThis as any).pdfjsWorker = pdfjsWorker;

    const loadingTask = pdfjs.getDocument({
      data: new Uint8Array(arrayBuffer),
      useWorkerFetch: false,
      isEvalSupported: false,
      useSystemFonts: true,
    });
    const doc = await loadingTask.promise;

    let fullText = "";
    for (let i = 1; i <= doc.numPages; i++) {
      const page = await doc.getPage(i);
      const content = (await page.getTextContent({
        includeMarkedContent: false,
      })) as any;
      fullText += extractPageText(content.items as PdfTextItem[]);
      page.cleanup();
    }

    // Run through the same pipeline as /api/import
    const parsed = rawToResume(fullText);
    const resume = parseResumeJson(parsed);

    console.log(`\n=== PARSED RESUME ===`);
    console.log(`Name: ${resume.name}`);
    console.log(`Email: ${resume.email}`);
    console.log(`Phone: ${resume.phone}`);
    console.log(`Title: ${resume.title}`);
    console.log(`Summary: ${(resume.summary || "").substring(0, 100)}`);

    console.log(`\n--- Experience (${resume.experience.length}) ---`);
    resume.experience.forEach((exp, i) => {
      console.log(`  ${i + 1}. ${exp.position} @ ${exp.company}`);
      console.log(`     Duration: ${exp.duration}`);
      console.log(`     Location: ${exp.location || "(none)"}`);
      console.log(`     Description: ${(exp.description || "").substring(0, 120)}...`);
    });

    console.log(`\n--- Education (${resume.education.length}) ---`);
    resume.education.forEach((edu, i) => {
      console.log(`  ${i + 1}. ${edu.school} | ${edu.degree} | ${edu.year}`);
    });

    console.log(`\n--- Skills (${resume.skills.length}) ---`);
    resume.skills.forEach((s) => console.log(`  - ${s.name}`));

    console.log(`\n--- Projects (${resume.projects.length}) ---`);
    resume.projects.forEach((p) => {
      console.log(`  - ${p.name}: ${(p.description || "").substring(0, 80)}`);
    });

    console.log(`\n--- Certifications (${resume.certifications.length}) ---`);
    resume.certifications.forEach((c) => {
      console.log(`  - ${c.name} | ${c.issuer} | ${c.date}`);
    });

    // Verify critical fields
    console.log(`\n=== VERIFICATION ===`);

    // Personal info
    expect(resume.name).toBeTruthy();
    expect(resume.email).toBeTruthy();
    expect(resume.phone).toBeTruthy();

    // Experience: must have at least 2 entries with actual descriptions
    expect(resume.experience.length).toBeGreaterThanOrEqual(2);
    const hasDescriptions = resume.experience.filter(
      (e) => e.description && e.description.length > 50
    );
    console.log(`Experience entries with descriptions: ${hasDescriptions.length}/${resume.experience.length}`);
    expect(hasDescriptions.length).toBeGreaterThanOrEqual(2);

    // Each experience should have a company
    const withCompany = resume.experience.filter((e) => e.company && e.company.length > 2);
    console.log(`Experience entries with company: ${withCompany.length}/${resume.experience.length}`);
    expect(withCompany.length).toBeGreaterThanOrEqual(2);

    // Education: must have at least 1 entry
    expect(resume.education.length).toBeGreaterThanOrEqual(1);
    console.log(`Education entries: ${resume.education.length}`);

    // Skills: must have at least 4
    expect(resume.skills.length).toBeGreaterThanOrEqual(4);
    console.log(`Skills: ${resume.skills.length}`);

    console.log(`\n✅ ALL VERIFICATIONS PASSED`);
  });
});
