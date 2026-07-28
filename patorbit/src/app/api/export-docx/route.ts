import { NextRequest, NextResponse } from "next/server";
import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  AlignmentType,
  BorderStyle,
} from "docx";

interface ResumeData {
  name: string;
  title: string;
  email: string;
  phone: string;
  address: string;
  nationality: string;
  pronouns: string;
  summary: string;
  social: { linkedin: string; github: string; website: string; twitter: string; portfolio: string; stackoverflow: string };
  experience: { id: number; company: string; position: string; location: string; duration: string; description: string }[];
  education: { id: number; school: string; degree: string; year: string; field: string }[];
  skills: { id: number; name: string; level: string; category: string; years: string }[];
  projects: { id: number; name: string; description: string; tech: string; link: string }[];
  certifications: { id: number; name: string; issuer: string; date: string }[];
  templateId: string;
}

function addFormattedParagraphs(text: string): Paragraph[] {
  if (!text) return [];

  const paragraphs: Paragraph[] = [];
  const lines = text.split('\n').filter(line => line.trim() !== '');

  for (const line of lines) {
    const trimmedLine = line.trim();
    if (trimmedLine.startsWith('•') || trimmedLine.startsWith('-') || trimmedLine.startsWith('*')) {
      paragraphs.push(new Paragraph({
        text: trimmedLine.substring(1).trim(),
        bullet: { level: 0 },
        style: "default",
      }));
    } else if (/^\d+[.)]/.test(trimmedLine)) {
      const textContent = trimmedLine.replace(/^\d+[.)]\s*/, '');
      paragraphs.push(new Paragraph({
        text: textContent,
        numbering: {
          reference: "default-numbering",
          level: 0,
        },
        style: "default",
      }));
    } else {
      paragraphs.push(new Paragraph({
        children: [new TextRun({ text: trimmedLine, size: 20, font: "Calibri", color: "374151" })],
        style: "default",
      }));
    }
  }
  return paragraphs;
}

function buildDoc(data: ResumeData): Document {
  const children: Paragraph[] = [];
  const primaryColor = "1e3a8a";
  const mutedColor = "4b5563";

  // ── Header ──
  children.push(new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { after: 60 },
    children: [
      new TextRun({ text: data.name || "Your Name", bold: true, size: 32, font: "Calibri", color: "111827" }),
    ],
  }));

  if (data.title) {
    children.push(new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 80 },
      children: [
        new TextRun({ text: data.title, size: 22, font: "Calibri", color: mutedColor }),
      ],
    }));
  }

  const contactParts = [data.email, data.phone, data.address, data.nationality].filter(Boolean);
  if (contactParts.length > 0) {
    children.push(new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 120 },
      children: [
        new TextRun({ text: contactParts.join("  |  "), size: 18, font: "Calibri", color: mutedColor }),
      ],
    }));
  }

  // ── Helper: Section Headers ──
  function addSection(title: string) {
    children.push(new Paragraph({
      spacing: { before: 80, after: 40 },
      border: { bottom: { color: primaryColor, size: 6, style: BorderStyle.SINGLE, space: 4 } },
      children: [
        new TextRun({ text: title, bold: true, size: 20, font: "Calibri", color: primaryColor }),
      ],
    }));
  }

  // ── Summary ──
  if (data.summary) {
    addSection("SUMMARY");
    children.push(...addFormattedParagraphs(data.summary));
    children.push(new Paragraph({ spacing: { after: 80 } }));
  }

  // ── Experience ──
  if (data.experience.length > 0) {
    addSection("EXPERIENCE");
    for (const exp of data.experience) {
      children.push(new Paragraph({
        spacing: { before: 60, after: 20 },
        children: [
          new TextRun({ text: exp.position, bold: true, size: 21, font: "Calibri", color: "111827" }),
          new TextRun({ text: exp.company ? `  at ${exp.company}` : "", size: 20, font: "Calibri", color: mutedColor }),
          new TextRun({ text: exp.duration ? `  (${exp.duration})` : "", size: 18, font: "Calibri", color: "9ca3af" }),
        ],
      }));
      if (exp.location) {
        children.push(new Paragraph({
          spacing: { after: 20 },
          children: [new TextRun({ text: exp.location, size: 18, font: "Calibri", color: "9ca3af" })],
        }));
      }
      if (exp.description) {
        children.push(...addFormattedParagraphs(exp.description));
      }
      children.push(new Paragraph({ spacing: { after: 60 } }));
    }
  }

  // ── Education ──
  if (data.education.length > 0) {
    addSection("EDUCATION");
    for (const edu of data.education) {
      children.push(new Paragraph({
        spacing: { before: 40, after: 20 },
        children: [
          new TextRun({ text: edu.school, bold: true, size: 21, font: "Calibri", color: "111827" }),
          new TextRun({ text: edu.degree ? `  — ${edu.degree}${edu.field ? `, ${edu.field}` : ""}` : "", size: 20, font: "Calibri", color: mutedColor }),
        ],
      }));
      if (edu.year) {
        children.push(new Paragraph({
          spacing: { after: 40 },
          children: [new TextRun({ text: edu.year, size: 18, font: "Calibri", color: "9ca3af" })],
        }));
      }
    }
  }

  // ── Skills ──
  if (data.skills.length > 0) {
    addSection("SKILLS");
    const skillText = data.skills
      .slice(0, 8)
      .map((s) => `${s.name}${s.level && s.level !== "Intermediate" ? ` (${s.level})` : ""}`)
      .join("  |  ");
    children.push(new Paragraph({
      spacing: { after: 40 },
      children: [new TextRun({ text: skillText, size: 20, font: "Calibri", color: "374151" })],
    }));
  }

  // ── Projects ──
  if (data.projects.length > 0) {
    addSection("PROJECTS");
    for (const proj of data.projects) {
      children.push(new Paragraph({
        spacing: { before: 40, after: 20 },
        children: [
          new TextRun({ text: proj.name, bold: true, size: 21, font: "Calibri", color: "111827" }),
          new TextRun({ text: proj.tech ? `  | ${proj.tech}` : "", size: 20, font: "Calibri", color: mutedColor }),
        ],
      }));
      if (proj.description) {
        children.push(...addFormattedParagraphs(proj.description));
      }
      children.push(new Paragraph({ spacing: { after: 40 } }));
    }
  }

  // ── Certifications ──
  if (data.certifications.length > 0) {
    addSection("CERTIFICATIONS");
    for (const cert of data.certifications) {
      children.push(new Paragraph({
        spacing: { after: 60 },
        children: [
          new TextRun({ text: cert.name, bold: true, size: 20, font: "Calibri", color: "111827" }),
          new TextRun({ text: cert.issuer ? `  — ${cert.issuer}` : "", size: 20, font: "Calibri", color: mutedColor }),
        ],
      }));
    }
  }

  return new Document({
    styles: {
      paragraphStyles: [
        {
          id: "default",
          name: "Default",
          basedOn: "Normal",
          next: "Normal",
          quickFormat: true,
          run: {
            font: "Calibri",
            size: 22,
          },
        },
      ],
    },
    numbering: {
      config: [
        {
          reference: "default-numbering",
          levels: [
            {
              level: 0,
              format: "decimal",
              text: "%1.",
              alignment: AlignmentType.START,
              style: {
                paragraph: {
                  indent: { left: 720, hanging: 360 },
                },
              },
            },
          ],
        },
      ],
    },
    sections: [
      {
        properties: {
          page: {
            margin: { top: 720, bottom: 720, left: 720, right: 720 },
          },
        },
        children,
      },
    ],
  });
}

export async function POST(request: NextRequest) {
  try {
    const data: ResumeData = await request.json();
    const doc = buildDoc(data);
    const buffer = await Packer.toBuffer(doc);

    return new NextResponse(buffer, {
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "Content-Disposition": `attachment; filename="resume.docx"`,
      },
    });
  } catch (error) {
    console.error("DOCX export error:", error);
    return NextResponse.json(
      { error: "Failed to generate DOCX file." },
      { status: 500 }
    );
  }
}