"use server";

import { NextRequest, NextResponse } from "next/server";
import * as mammoth from "mammoth";
import { parseResumeJson, ResumeSchema } from "@/utils/resume-schema";
import { rawToResume } from "@/utils/resume-parser";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json(
        { error: "Please select a file to import." },
        { status: 400 }
      );
    }

    const fileType = file.type;
    let parsedData: any;

    if (fileType === "application/json") {
      // Handle JSON file
      const text = await file.text();
      parsedData = JSON.parse(text);
    } else if (fileType === "application/pdf") {
      // Handle PDF file — extract text, return as a resume object with text in summary
      const arrayBuffer = await file.arrayBuffer();
      const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");
      const workerPath = "file://" + process.cwd().replace(/\\/g, "/") + "/public/pdf.worker.mjs";
      pdfjs.GlobalWorkerOptions.workerSrc = workerPath;
      const loadingTask = pdfjs.getDocument({ data: new Uint8Array(arrayBuffer) });
      const doc = await loadingTask.promise;
      let fullText = "";
      for (let i = 1; i <= doc.numPages; i++) {
        const page = await doc.getPage(i);
        const content = await page.getTextContent();
        const strings = content.items.map((item: any) => item.str);
        fullText += strings.join(" ") + "\n\n";
        page.cleanup();
      }
      parsedData = rawToResume(fullText);
    } else if (
      fileType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    ) {
      // Handle DOCX file
      const arrayBuffer = await file.arrayBuffer();
      const result = await mammoth.extractRawText({ buffer: arrayBuffer as any });
      parsedData = rawToResume(result.value);
    } else {
      return NextResponse.json(
        { error: "Unsupported file type. Please upload a JSON, PDF, or DOCX file." },
        { status: 400 }
      );
    }

    // Validate parsed data
    const validatedData = parseResumeJson(parsedData);

    return NextResponse.json(validatedData);
  } catch (error) {
    console.error("Import error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to import the file" },
      { status: 500 }
    );
  }
}