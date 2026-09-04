"use client";

import { useEffect, useRef, useState } from "react";
import { ResumePreview } from "@/components/resume/ResumePreview";
import { TEMPLATES } from "@/app/resume-builder/templates";
import type { Resume } from "@/types/resume";
import { getTemplateDemoResume } from "./template-demo-data";

// A4 at 96 dpi
const RESUME_WIDTH = 794;

interface MiniaturePreviewProps {
  templateId: string;
  /** Optional actual resume data. If not provided, uses gallery sample. */
  resume?: Resume;
}

export function MiniaturePreview({ templateId, resume: resumeProp }: MiniaturePreviewProps) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  const [scale, setScale] = useState(0.25);

  // Lazy render — only when card enters the viewport
  useEffect(() => {
    const el = wrapperRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          io.disconnect();
        }
      },
      { rootMargin: "150px" }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  // Recompute scale whenever the card resizes (responsive grid)
  useEffect(() => {
    const el = wrapperRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => {
      const w = entry.contentRect.width;
      if (w > 0) setScale(w / RESUME_WIDTH);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const template = TEMPLATES.find((t) => t.id === templateId) ?? TEMPLATES[0];
  const resume: Resume = resumeProp
    ? { ...resumeProp, templateId }
    : { ...getTemplateDemoResume(templateId), templateId };

  return (
    <div
      ref={wrapperRef}
      className="w-full aspect-[3/4] overflow-hidden rounded-lg bg-white relative"
    >
      {visible ? (
        <div
          aria-hidden="true"
          style={{
            width: RESUME_WIDTH,
            transformOrigin: "top left",
            transform: `scale(${scale})`,
            pointerEvents: "none",
            userSelect: "none",
          }}
        >
          <ResumePreview resume={resume} template={template} />
        </div>
      ) : (
        <div className="w-full h-full bg-slate-100 animate-pulse rounded-lg" />
      )}
    </div>
  );
}
