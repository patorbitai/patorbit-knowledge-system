"use client";

import React from "react";
import { typeSize, spaceSize } from "@/lib/resume-design-system";
import type { SocialLinks as SocialLinksShape } from "@/types/resume";
import {
  linkLabel,
  mailtoHref,
  safeHref,
  telHref,
  toSafeHref,
} from "@/lib/resume-links";

/* ── Shared Types ──
 * Single source of truth: these types are defined once in src/types/resume.ts
 * and re-exported here so every template component consumes the canonical
 * shape. Do not redeclare local Resume/entity types.
 *
 * NOTE: `SocialLinks` is intentionally NOT re-exported as a type here — the
 * SocialLinks *component* below owns that name. Components needing the type can
 * import it directly from `@/types/resume`. */
import type {
  Experience,
  Education,
  Skill,
  Project,
  Certification,
  Language,
  Interest,
  Achievement,
  Reference,
  Resume,
} from "@/types/resume";

export type {
  Experience,
  Education,
  Skill,
  Project,
  Certification,
  Language,
  Interest,
  Achievement,
  Reference,
  Resume,
};

/* ── FormattedDescription ── */
export function FormattedDescription({ text, color, mutedColor, size = "xs" }: { text: string; color: string; mutedColor?: string; size?: string }) {
  if (!text) return null;
  const lines = text.split("\n").filter(line => line.trim().length > 0);
  // Token-based inline size (NOT Tailwind text-xs): a fixed 12px class would
  // override the parent's readable scale — summaries/descriptions must render
  // at body size and follow --rs-type + the --resume-* tokens like everything
  // else.
  const sizeStyle: React.CSSProperties = {
    fontSize: size === "sm" ? typeSize("company") : typeSize("body"),
  };
  const listItems = lines.map(line => {
    const trimmed = line.trim();
    const isBulleted = /^[•\-\*]\s*/.test(trimmed);
    const isNumbered = /^\d+[.)]\s*/.test(trimmed);
    if (isBulleted) return { type: 'ul', content: trimmed.replace(/^[•\-\*]\s*/, "") };
    if (isNumbered) return { type: 'ol', content: trimmed.replace(/^\d+[.)]\s*/, "") };
    return { type: 'p', content: line };
  });
  const hasList = listItems.some(item => item.type === 'ul' || item.type === 'ol');
  if (hasList) {
    let olCounter = 1;
    return (<div className="mt-0.5 space-y-0.5">{listItems.map((item, i) => { if (item.type === 'ul') return (<div key={i} className="flex gap-1.5 items-start"><span className="shrink-0 leading-relaxed" style={{ color: mutedColor || color, fontSize: sizeStyle.fontSize }}>•</span><span className="leading-relaxed" style={{ color: mutedColor || color, ...sizeStyle }}>{item.content}</span></div>); if (item.type === 'ol') { const c = olCounter++; return (<div key={i} className="flex gap-1.5 items-start"><span className="shrink-0 font-medium leading-relaxed min-w-[16px]" style={{ color, fontSize: sizeStyle.fontSize }}>{c}.</span><span className="leading-relaxed" style={{ color: mutedColor || color, ...sizeStyle }}>{item.content}</span></div>); } return <p key={i} className="mt-0.5 leading-relaxed" style={{ color: mutedColor || color, ...sizeStyle }}>{item.content}</p>; })}</div>);
  }
  return (<div className="space-y-1">{lines.map((line, i) => (<p key={i} className="leading-relaxed" style={{ color: mutedColor || color, whiteSpace: "pre-wrap", ...sizeStyle }}>{line}</p>))}</div>);
}

/* ── Social URL helpers ──
 * Display-only normalization kept for backwards compatibility. HREFS must
 * go through @/lib/resume-links (toSafeHref) — unsafe schemes (javascript:,
 * data:, vbscript:) are rejected there before anything becomes clickable. */
export function normalizeSocialUrl(value: string | undefined | null): string {
  if (!value) return "";
  const trimmed = value.trim();
  if (!trimmed) return "";
  return /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
}

/** Clean visible label for a social URL: protocol stripped, trailing slash removed. */
export function socialUrlLabel(value: string | undefined | null): string {
  return linkLabel(value);
}

/** A real clickable social/profile link. Normalized https href, opens in a new
 *  tab, never leaks the referrer. The visible text is the clean profile URL as
 *  plain DOM text — ATS parsers still read it. No SVG icons here. */
export function SocialLink({
  href,
  label,
  className,
  style,
}: {
  href: string | undefined | null;
  label?: string;
  className?: string;
  style?: React.CSSProperties;
}) {
  const raw = (href ?? "").trim();
  if (!raw) return null;
  const { ok, href: url } = toSafeHref(raw);
  const text = label ?? linkLabel(raw);
  // Unsafe or un-parseable values stay VISIBLE as plain text — never
  // clickable, never silently dropped (ATS parsers still read them).
  // Colour: a non-link must never inherit the row's accent/link colour and
  // masquerade as blue body text — it follows the metadata token instead
  // (--resume-muted on the template scope, neutral fallback outside it).
  if (!ok) {
    return (
      <span
        className={className}
        style={{ ...style, color: "var(--resume-muted, #64748b)" }}
      >
        {text}
      </span>
    );
  }
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className={className}
      style={{
        color: "inherit",
        textDecoration: "underline",
        textUnderlineOffset: "2px",
        ...style,
      }}
    >
      {text}
    </a>
  );
}

/** Keys rendered in the header contact row, in order. */
export const SOCIAL_ROW_KEYS: Array<keyof SocialLinksShape> = [
  "linkedin",
  "github",
  "website",
  "portfolio",
  "twitter",
  "stackoverflow",
];

/**
 * A row of the resume's social links as REAL text anchors (no icons, clean
 * URL labels — ATS-safe). Unsafe values render as plain text via SocialLink.
 * `separator` renders an inline row (" | "); without it the anchors are
 * returned as a fragment so the caller's flex/gap layout still applies.
 */
export function SocialLinkRow({
  social,
  separator,
  className,
  style,
}: {
  social?: SocialLinksShape | null;
  separator?: string;
  className?: string;
  style?: React.CSSProperties;
}) {
  const values = SOCIAL_ROW_KEYS.map((k) => social?.[k]?.trim()).filter(
    (v): v is string => !!v,
  );
  if (values.length === 0) return null;
  if (!separator) {
    return (
      <>
        {values.map((v, i) => (
          <SocialLink key={`${v}_${i}`} href={v} className={className} style={style} />
        ))}
      </>
    );
  }
  return (
    <>
      {values.map((v, i) => (
        <span key={`${v}_${i}`}>
          {i > 0 && separator}
          <SocialLink href={v} className={className} style={style} />
        </span>
      ))}
    </>
  );
}

/**
 * A single contact value: a real mailto:/tel: link for email/phone (plain
 * text when the value can't be trusted), plain text for everything else.
 */
export function ContactValue({
  value,
  kind,
  className,
  style,
}: {
  value?: string | null;
  kind: "email" | "phone" | "text";
  className?: string;
  style?: React.CSSProperties;
}) {
  const raw = (value ?? "").trim();
  if (!raw) return null;
  const href = kind === "email" ? mailtoHref(raw) : kind === "phone" ? telHref(raw) : "";
  if (!href) {
    return (
      <span className={className} style={style}>
        {raw}
      </span>
    );
  }
  return (
    <a
      href={href}
      className={className}
      style={{
        color: "inherit",
        textDecoration: "underline",
        textUnderlineOffset: "2px",
        ...style,
      }}
    >
      {raw}
    </a>
  );
}

/** Render a row of contact parts separated by a dot, turning the LinkedIn,
 *  GitHub, email and phone entries into real hyperlinks while leaving the
 *  rest as plain text. */
export function ContactRow({
  parts,
  email,
  phone,
  linkedin,
  github,
  separator = "  ·  ",
}: {
  parts: string[];
  email?: string;
  phone?: string;
  linkedin?: string;
  github?: string;
  separator?: string;
}) {
  const hrefFor = (part: string): { href: string; web: boolean } => {
    if (email && part === email) return { href: mailtoHref(part), web: false };
    if (phone && part === phone) return { href: telHref(part), web: false };
    if (linkedin && part === linkedin) return { href: safeHref(part), web: true };
    if (github && part === github) return { href: safeHref(part), web: true };
    return { href: "", web: false };
  };
  return (
    <>
      {parts.map((part, i) => {
        const { href, web } = hrefFor(part);
        return (
          <span key={i}>
            {i > 0 && separator}
            {href ? (
              web ? (
                <SocialLink href={part} />
              ) : (
                <a
                  href={href}
                  style={{ color: "inherit", textDecoration: "underline", textUnderlineOffset: "2px" }}
                >
                  {part}
                </a>
              )
            ) : (
              part
            )}
          </span>
        );
      })}
    </>
  );
}

/* ── SocialLinks ── */
export function SocialLinks({ social, color, size = "sm" }: { social: SocialLinksShape; color: string; size?: "sm" | "xs" }) {
  const s = size === "sm" ? "w-4 h-4" : "w-3.5 h-3.5";
  const links = [
    // LinkedIn and GitHub are clean text hyperlinks (no SVG icons).
    { key: "linkedin", href: social.linkedin, icon: null },
    { key: "github", href: social.github, icon: null },
    { key: "twitter", href: social.twitter, icon: <svg className={s} viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg> },
    { key: "website", href: social.website, icon: <svg className={s} fill="none" stroke="currentColor" strokeWidth={2}><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z"/></svg> },
    { key: "portfolio", href: social.portfolio, icon: <svg className={s} viewBox="0 0 24 24" fill="currentColor"><path d="M12 24C5.385 24 0 18.615 0 12S5.385 0 12 0s12 5.385 12 12-5.385 12-12 12zm-1.286-13.919c.46-.256.85-.49 1.145-.674.532-.33.8-.711.806-1.142.006-.488-.24-.93-.74-1.326-.498-.396-1.232-.594-2.202-.594-1.118 0-2.016.386-2.692 1.158-.676.772-1.014 1.826-1.014 3.163 0 1.416.35 2.482 1.048 3.2.698.716 1.534 1.075 2.508 1.075.562 0 1.146-.16 1.753-.479.162-.083.243-.138.243-.167 0-.076-.016-.482-.049-1.218-.033-.736-.048-1.27-.048-1.603 0-.736.505-1.098 1.506-1.098.356 0 .713.108 1.07.324.357.216.536.54.536.973v.848c0 2.05-.438 3.597-1.314 4.641-.876 1.044-2.11 1.566-3.701 1.566-1.795 0-3.272-.66-4.432-1.98-1.16-1.32-1.74-3.079-1.74-5.279 0-2.23.596-3.98 1.788-5.249 1.192-1.27 2.656-1.905 4.391-1.905 1.574 0 2.891.51 3.951 1.53 1.06 1.02 1.54 2.21 1.44 3.57 0 .56-.262 1.018-.787 1.374z"/></svg> },
    { key: "stackoverflow", href: social.stackoverflow, icon: <svg className={s} viewBox="0 0 24 24" fill="currentColor"><path d="M21.008 0c1.105 0 2 .895 2 2v20c0 1.105-.895 2-2 2H2.998c-1.105 0-2-.895-2-2V2c0-1.105.895-2 2-2h18.01zM8.947 5.356H5.663v12.29h3.284V5.356zm1.905 0v12.29h1.98c2.586 0 3.972-1.469 3.972-3.934 0-2.022-1.18-3.28-2.933-3.392 1.418-.275 2.574-1.575 2.574-3.03 0-2.138-1.34-3.934-3.605-3.934h-1.988zm1.417 5.39c.932 0 1.56.53 1.56 1.557 0 1.025-.628 1.555-1.56 1.555h-1.242v-3.112h1.242zm-.175-4.153c.75 0 1.29.479 1.29 1.341 0 .866-.54 1.34-1.29 1.34h-1.067V6.593h1.067z"/></svg> },
  ];
  return (<div className="flex flex-wrap gap-x-3 gap-y-1" style={{ color }}>{links.map(({ key, href, icon }) => href && (<a key={key} href={normalizeSocialUrl(href)} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 hover:underline">{icon}{<span style={{ fontSize: size === "xs" ? typeSize("body") : typeSize("company") }}>{socialUrlLabel(href)}</span>}</a>))}</div>);
}

export function levelToDots(level: string | undefined): number {
  switch (level) { case "Expert": return 4; case "Advanced": return 3; case "Intermediate": return 2; case "Beginner": return 1; default: return 2; }
}

/* ── Shared Body Sections ──────────────────────────────────────────────────
 * Reusable section renderers for all templates. Templates import these to
 * avoid duplicating the same Experience/Skills/Education rendering logic.
 * Each renderer accepts a minimal config for colors and bullet style.
 */

export interface SectionTheme {
  ink: string;
  body: string;
  muted: string;
  light?: string;
  accent?: string;
  border?: string;
  bulletChar?: string; // default "▸"
  /** Accent-colored bullet glyphs — creative/expressive families only. */
  bulletAccent?: boolean;
  /** Accent-colored headings/title — creative/expressive families only. */
  accentHeadings?: boolean;
}

/** Format a date string from duration or start/end dates. */
export function fmtDate(exp: { duration?: string; startDate?: string; endDate?: string }): string {
  return exp.duration || [exp.startDate, exp.endDate].filter(Boolean).join(" – ");
}

/** Render an experience entry. Hierarchy: COMPANY bold-ink · dates muted meta,
 *  role line under it, then bullets at body size with a neutral rhythm. */
export function ExperienceEntry({ exp, theme }: { exp: Resume["experience"][0]; theme: SectionTheme }) {
  const t = theme;
  const b = t.bulletChar || "▸";
  const dateStr = fmtDate(exp);
  const glyphColor = t.bulletAccent ? (t.accent || t.muted) : t.muted;
  return (
    <div style={{ marginBottom: spaceSize("itemGap"), breakInside: "avoid" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 8 }}>
        <span style={{ fontSize: typeSize("company"), fontWeight: 700, color: t.ink, lineHeight: 1.3 }}>{exp.company}</span>
        {dateStr && <span style={{ fontSize: typeSize("meta"), fontWeight: 400, color: t.muted, whiteSpace: "nowrap", flexShrink: 0 }}>{dateStr}</span>}
      </div>
      <div style={{ fontSize: typeSize("role"), color: t.body, marginTop: spaceSize("metaGap"), lineHeight: 1.4 }}>
        <span style={{ fontWeight: 600 }}>{exp.position}</span>
        {exp.employmentType && <span style={{ color: t.muted }}> · {exp.employmentType}</span>}
        {exp.location && <span style={{ color: t.muted }}> · {exp.location}</span>}
      </div>
      {exp.description && (
        <div style={{ marginTop: spaceSize("roleGap"), fontSize: typeSize("body"), lineHeight: 1.6, color: t.body }}>
          <FormattedDescription text={exp.description} color={t.body} mutedColor={t.muted} size="xs" />
        </div>
      )}
      {exp.bulletPoints && exp.bulletPoints.length > 0 && (
        <ul style={{ margin: `${spaceSize("roleGap")} 0 0 0`, padding: 0, listStyle: "none" }}>
          {exp.bulletPoints.map((bp, i) => (
            <li key={i} style={{ fontSize: typeSize("body"), lineHeight: 1.5, color: t.body, paddingLeft: 12, position: "relative", marginBottom: spaceSize("bulletGap") }}>
              <span style={{ position: "absolute", left: 0, color: glyphColor, fontSize: typeSize("bullet"), top: 2 }}>{b}</span>
              {bp}
            </li>
          ))}
        </ul>
      )}
      {exp.techUsed && (
        <div style={{ fontSize: typeSize("skill"), color: t.muted, marginTop: spaceSize("metaGap"), lineHeight: 1.5 }}>
          {exp.techUsed.split(/[,;]/).map((t2) => t2.trim()).filter(Boolean).join(" · ")}
        </div>
      )}
    </div>
  );
}

/** Render an education entry — school + date row, then ONE detail line
 *  (degree · field · GPA · honors · location inline). No orphan lines, no
 *  unexplained vertical gaps. */
export function EducationEntry({ edu, theme, compact = false }: { edu: Resume["education"][0]; theme: SectionTheme; compact?: boolean }) {
  const t = theme;
  const details: React.ReactNode[] = [];
  if (edu.degree || edu.field) {
    details.push(<span key="deg" style={{ fontWeight: 500 }}>{edu.degree}{edu.field ? ` in ${edu.field}` : ""}</span>);
  }
  if (!compact && edu.gpa) details.push(<span key="gpa" style={{ color: t.muted }}> · GPA {edu.gpa}</span>);
  if (!compact && edu.honors) details.push(<span key="hon" style={{ color: t.muted }}> · {edu.honors}</span>);
  if (!compact && edu.location) details.push(<span key="loc" style={{ color: t.muted }}> · {edu.location}</span>);
  return (
    <div style={{ marginBottom: spaceSize("itemGap"), breakInside: "avoid" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 8 }}>
        <span style={{ fontSize: typeSize("company"), fontWeight: 700, color: t.ink }}>{edu.school}</span>
        {edu.year && <span style={{ fontSize: typeSize("meta"), fontWeight: 400, color: t.muted, whiteSpace: "nowrap" }}>{edu.year}</span>}
      </div>
      {details.length > 0 && (
        <div style={{ fontSize: typeSize("role"), color: t.body, marginTop: spaceSize("metaGap") }}>
          {details}
        </div>
      )}
    </div>
  );
}

/** Render a project entry. */
export function ProjectEntry({ proj, theme }: { proj: Resume["projects"][0]; theme: SectionTheme }) {
  const t = theme;
  const b = t.bulletChar || "▸";
  const glyphColor = t.bulletAccent ? (t.accent || t.muted) : t.muted;
  const dateStr = [proj.startDate, proj.endDate].filter(Boolean).join(" – ");
  return (
    <div style={{ marginBottom: spaceSize("itemGap"), breakInside: "avoid" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 8 }}>
        <span style={{ fontSize: typeSize("company"), fontWeight: 700, color: t.ink }}>{proj.name}</span>
        {dateStr && <span style={{ fontSize: typeSize("meta"), fontWeight: 400, color: t.muted, whiteSpace: "nowrap" }}>{dateStr}</span>}
      </div>
      {proj.role && <div style={{ fontSize: typeSize("role"), color: t.body, fontWeight: 500, marginTop: spaceSize("metaGap") }}>{proj.role}</div>}
      {proj.tech && (
        <div style={{ fontSize: typeSize("skill"), color: t.muted, marginTop: spaceSize("metaGap"), lineHeight: 1.5 }}>
          {proj.tech.split(/[,;]/).map((t2) => t2.trim()).filter(Boolean).join(" · ")}
        </div>
      )}
      {proj.description && (
        <div style={{ marginTop: spaceSize("metaGap"), fontSize: typeSize("body"), lineHeight: 1.5, color: t.body }}>
          <FormattedDescription text={proj.description} color={t.body} mutedColor={t.muted} size="xs" />
        </div>
      )}
      {proj.bulletPoints && proj.bulletPoints.length > 0 && (
        <ul style={{ margin: `${spaceSize("metaGap")} 0 0 0`, padding: 0, listStyle: "none" }}>
          {proj.bulletPoints.map((bp, i) => (
            <li key={i} style={{ fontSize: typeSize("body"), lineHeight: 1.5, color: t.body, paddingLeft: 12, position: "relative", marginBottom: spaceSize("bulletGap") }}>
              <span style={{ position: "absolute", left: 0, color: glyphColor, fontSize: typeSize("bullet"), top: 2 }}>{b}</span>
              {bp}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/** Render a standard certifications section. */
export function CertificationsList({ certs, theme }: { certs: Resume["certifications"]; theme: SectionTheme }) {
  const t = theme;
  return (
    <>
      {certs.map((c) => (
        <div key={c.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: spaceSize("bulletGap"), breakInside: "avoid", gap: 8 }}>
          <div>
            <span style={{ fontSize: typeSize("body"), fontWeight: 600, color: t.ink }}>{c.name}</span>
            {c.issuer && <span style={{ fontSize: typeSize("meta"), fontWeight: 400, color: t.muted }}> — {c.issuer}</span>}
          </div>
          {c.date && <span style={{ fontSize: typeSize("meta"), fontWeight: 400, color: t.muted, whiteSpace: "nowrap" }}>{c.date}</span>}
        </div>
      ))}
    </>
  );
}

/** Render a standard achievements section. */
export function AchievementsList({ achievements, theme }: { achievements: Resume["achievements"]; theme: SectionTheme }) {
  const t = theme;
  return (
    <>
      {achievements.map((a) => (
        <div key={a.id} style={{ fontSize: typeSize("body"), color: t.body, marginBottom: spaceSize("bulletGap"), breakInside: "avoid" }}>
          {a.title && <span style={{ fontWeight: 600 }}>{a.title}</span>}
          {a.title && a.description && <span> — </span>}
          {a.description && <span>{a.description}</span>}
          {a.date && <span style={{ color: t.muted, fontSize: typeSize("meta") }}> ({a.date})</span>}
        </div>
      ))}
    </>
  );
}

/** Render a standard languages section: `English — Fluent · Hindi — Native`. */
export function LanguagesList({ languages, theme }: { languages: Resume["languages"]; theme: SectionTheme }) {
  const t = theme;
  return (
    <div style={{ fontSize: typeSize("body"), color: t.body, lineHeight: 1.6 }}>
      {languages.map((l, i) => (
        <span key={l.id}>
          {i > 0 && <span style={{ color: t.muted }}> · </span>}
          {l.name}
          {l.proficiency && <span style={{ color: t.muted }}> — {l.proficiency}</span>}
        </span>
      ))}
    </div>
  );
}
