"use client";

import React from "react";
import type { SocialLinks as SocialLinksShape } from "@/types/resume";

/* ── Shared Types ──
 * Single source of truth: these types are defined once in src/types/resume.ts
 * and re-exported here so every template component consumes the canonical
 * shape. Do not redeclare local Resume/entity types.
 *
 * NOTE: `SocialLinks` is intentionally NOT re-exported as a type here — the
 * SocialLinks *component* below owns that name. Components needing the type can
 * import it directly from `@/types/resume`. */
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
} from "@/types/resume";

/* ── FormattedDescription ── */
export function FormattedDescription({ text, color, mutedColor, size = "xs" }: { text: string; color: string; mutedColor?: string; size?: string }) {
  if (!text) return null;
  const lines = text.split("\n").filter(line => line.trim().length > 0);
  const sizeClass = size === "sm" ? "text-sm" : "text-xs";
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
    return (<div className="mt-0.5 space-y-0.5">{listItems.map((item, i) => { if (item.type === 'ul') return (<div key={i} className="flex gap-1.5 items-start"><span className="shrink-0 text-sm leading-relaxed" style={{ color: mutedColor || color }}>•</span><span className={`${sizeClass} leading-relaxed`} style={{ color: mutedColor || color }}>{item.content}</span></div>); if (item.type === 'ol') { const c = olCounter++; return (<div key={i} className="flex gap-1.5 items-start"><span className="shrink-0 font-medium text-xs leading-relaxed min-w-[16px]" style={{ color }}>{c}.</span><span className={`${sizeClass} leading-relaxed`} style={{ color: mutedColor || color }}>{item.content}</span></div>); } return <p key={i} className={`${sizeClass} mt-0.5 leading-relaxed`} style={{ color: mutedColor || color }}>{item.content}</p>; })}</div>);
  }
  return (<div className="space-y-1">{lines.map((line, i) => (<p key={i} className={`${sizeClass} leading-relaxed`} style={{ color: mutedColor || color, whiteSpace: "pre-wrap" }}>{line}</p>))}</div>);
}

/* ── Social URL helpers ──
 * Single source of truth for turning the user's social values into real,
 * normalized hyperlinks. Every template goes through these so behavior and
 * ATS-safe visible text stay identical everywhere. */
export function normalizeSocialUrl(value: string | undefined | null): string {
  if (!value) return "";
  const trimmed = value.trim();
  if (!trimmed) return "";
  return /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
}

/** Clean visible label for a social URL: protocol stripped, trailing slash removed. */
export function socialUrlLabel(value: string | undefined | null): string {
  const url = normalizeSocialUrl(value);
  return url.replace(/^https?:\/\//i, "").replace(/\/+$/, "");
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
  const url = normalizeSocialUrl(href);
  if (!url) return null;
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className={className}
      style={style ?? { color: "inherit", textDecoration: "underline", textUnderlineOffset: "2px" }}
    >
      {label ?? socialUrlLabel(href)}
    </a>
  );
}

/** Render a row of contact parts separated by a dot, turning the LinkedIn and
 *  GitHub entries into real hyperlinks while leaving the rest as plain text. */
export function ContactRow({
  parts,
  linkedin,
  github,
  separator = "  ·  ",
}: {
  parts: string[];
  linkedin?: string;
  github?: string;
  separator?: string;
}) {
  return (
    <>
      {parts.map((part, i) => (
        <span key={i}>
          {i > 0 && separator}
          {part === linkedin || part === github ? <SocialLink href={part} /> : part}
        </span>
      ))}
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
  return (<div className="flex flex-wrap gap-x-3 gap-y-1" style={{ color }}>{links.map(({ key, href, icon }) => href && (<a key={key} href={normalizeSocialUrl(href)} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 hover:underline">{icon}{<span className={size === "xs" ? "text-xs" : "text-sm"}>{socialUrlLabel(href)}</span>}</a>))}</div>);
}

export function levelToDots(level: string | undefined): number {
  switch (level) { case "Expert": return 4; case "Advanced": return 3; case "Intermediate": return 2; case "Beginner": return 1; default: return 2; }
}
