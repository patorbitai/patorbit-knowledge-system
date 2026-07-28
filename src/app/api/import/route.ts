"use server";

import { NextRequest, NextResponse } from "next/server";
import * as mammoth from "mammoth";
import * as pdfParse from "pdf-parse";
import { parseResumeJson } from "@/utils/resume-schema";
import { ResumeSchema } from "@/utils/resume-schema";

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
      // Handle PDF file
      const arrayBuffer = await file.arrayBuffer();
      parsedData = await (pdfParse as any)(Buffer.from(new Uint8Array(arrayBuffer)));
    } else if (
      fileType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    ) {
      // Handle DOCX file
      const arrayBuffer = await file.arrayBuffer();
      const result = await mammoth.convertToHtml({ buffer: arrayBuffer as any });
      parsedData = result.value;
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