"use client";

import React from "react";
import { typography, spacing, layout, type ColorScheme } from "./tokens";

// ── ResumePage ──────────────────────────────────────────────────────────────
export function ResumePage({
  children,
  fontFamily,
  color,
  backgroundColor = "#ffffff",
  className = "",
}: {
  children: React.ReactNode;
  fontFamily: string;
  color: string;
  backgroundColor?: string;
  className?: string;
}) {
  return (
    <div
      className={`bg-white rounded-lg shadow-2xl print:shadow-none print:rounded-none ${className}`}
      style={{ fontFamily, color, backgroundColor, maxWidth: layout.pageWidth }}
    >
      <main style={{ padding: layout.marginH }}>
        {children}
      </main>
    </div>
  );
}

// ── ResumeHeader ────────────────────────────────────────────────────────────
export function ResumeHeader({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <header className={className}>{children}</header>;
}

// ── ResumeSection ───────────────────────────────────────────────────────────
export function ResumeSection({
  title,
  children,
  accentColor,
  borderColor,
  className = "",
}: {
  title: string;
  children: React.ReactNode;
  accentColor: string;
  borderColor: string;
  className?: string;
}) {
  return (
    <section className={`break-inside-avoid ${className}`} style={{ marginBottom: spacing[6] }}>
      <h2
        className="break-after-avoid"
        style={{
          ...typography.section,
          color: accentColor,
          borderBottom: `1px solid ${borderColor}`,
          paddingBottom: spacing[2],
          marginBottom: spacing[4],
        }}
      >
        {title}
      </h2>
      {children}
    </section>
  );
}

// ── ResumeHeading ───────────────────────────────────────────────────────────
export function ResumeHeading({
  as: Tag = "h3",
  children,
  color,
  size = "entry",
  className = "",
}: {
  as?: "h1" | "h2" | "h3" | "h4";
  children: React.ReactNode;
  color: string;
  size?: "display" | "heading" | "entry";
  className?: string;
}) {
  const style = size === "display"
    ? typography.display
    : size === "heading"
    ? typography.heading
    : { fontSize: "0.8125rem", fontWeight: "600", lineHeight: "1.3" };
  return (
    <Tag className={`break-after-avoid ${className}`} style={{ ...style, color }}>
      {children}
    </Tag>
  );
}

// ── ResumeEntry ─────────────────────────────────────────────────────────────
export function ResumeEntry({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <article
      className={`break-inside-avoid ${className}`}
      style={{ marginBottom: spacing[4] }}
    >
      {children}
    </article>
  );
}

// ── ResumeSkillTag ───────────────────────────────────────────────────────────
export function ResumeSkillTag({
  children,
  color,
  backgroundColor,
}: {
  children: React.ReactNode;
  color: string;
  backgroundColor: string;
}) {
  return (
    <span
      className="inline-flex items-center rounded font-medium"
      style={{
        ...typography.caption,
        color,
        backgroundColor,
        paddingInline: "10px",
        paddingBlock: "2px",
      }}
    >
      {children}
    </span>
  );
}

// ── ResumeDivider ────────────────────────────────────────────────────────────
export function ResumeDivider({ color }: { color: string }) {
  return (
    <hr
      style={{
        borderColor: color,
        borderTopWidth: "1px",
        marginBlock: spacing[6],
      }}
    />
  );
}

// ── ResumeSidebar ─────────────────────────────────────────────────────────────
export function ResumeSidebar({
  children,
  backgroundColor,
  color,
  width = "220px",
}: {
  children: React.ReactNode;
  backgroundColor: string;
  color: string;
  width?: string;
}) {
  return (
    <aside
      className="shrink-0"
      style={{
        width,
        backgroundColor,
        color,
        padding: spacing[5],
      }}
    >
      {children}
    </aside>
  );
}
