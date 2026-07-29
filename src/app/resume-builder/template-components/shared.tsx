"use client";

import React from "react";

/* ── Shared Types ── */
export interface Experience { id: number; company: string; position: string; location: string; employmentType: string; industry: string; duration: string; description: string; achievements: string; techUsed: string; }
export interface Education { id: number; school: string; degree: string; year: string; field: string; gpa: string; minor: string; honors: string; activities: string; location: string; }
export interface Skill { id: number; name: string; level: "Beginner" | "Intermediate" | "Advanced" | "Expert"; category: string; years: string; }
export interface Project { id: number; name: string; description: string; tech: string; link: string; startDate: string; endDate: string; role: string; teamSize: string; status: "Completed" | "In Progress" | "Ongoing"; }
export interface Certification { id: number; name: string; issuer: string; date: string; link: string; description: string; expiryDate: string; skills: string; }
export interface Language { id: number; name: string; proficiency: "Native" | "Fluent" | "Professional" | "Conversational" | "Beginner"; }
export interface Interest { id: number; name: string; }
export interface Achievement { id: number; description: string; }
export interface Reference { id: number; name: string; company: string; position: string; email: string; phone: string; }
export interface SocialLinks { linkedin: string; github: string; website: string; twitter: string; portfolio: string; stackoverflow: string; }
export interface Resume { name: string; title: string; email: string; phone: string; address: string; nationality: string; pronouns: string; summary: string; social: SocialLinks; experience: Experience[]; education: Education[]; skills: Skill[]; projects: Project[]; certifications: Certification[]; languages: Language[]; interests: Interest[]; achievements: Achievement[]; references: Reference[]; templateId: string; }

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

/* ── SocialLinks ── */
export function SocialLinks({ social, color, size = "sm" }: { social: SocialLinks; color: string; size?: "sm" | "xs" }) {
  const s = size === "sm" ? "w-4 h-4" : "w-3.5 h-3.5";
  const links = [
    { key: "linkedin", href: social.linkedin, icon: <svg className={s} viewBox="0 0 24 24" fill="currentColor"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg> },
    { key: "github", href: social.github, icon: <svg className={s} viewBox="0 0 24 24" fill="currentColor"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg> },
    { key: "twitter", href: social.twitter, icon: <svg className={s} viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg> },
    { key: "website", href: social.website, icon: <svg className={s} fill="none" stroke="currentColor" strokeWidth={2}><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z"/></svg> },
    { key: "portfolio", href: social.portfolio, icon: <svg className={s} viewBox="0 0 24 24" fill="currentColor"><path d="M12 24C5.385 24 0 18.615 0 12S5.385 0 12 0s12 5.385 12 12-5.385 12-12 12zm-1.286-13.919c.46-.256.85-.49 1.145-.674.532-.33.8-.711.806-1.142.006-.488-.24-.93-.74-1.326-.498-.396-1.232-.594-2.202-.594-1.118 0-2.016.386-2.692 1.158-.676.772-1.014 1.826-1.014 3.163 0 1.416.35 2.482 1.048 3.2.698.716 1.534 1.075 2.508 1.075.562 0 1.146-.16 1.753-.479.162-.083.243-.138.243-.167 0-.076-.016-.482-.049-1.218-.033-.736-.048-1.27-.048-1.603 0-.736.505-1.098 1.506-1.098.356 0 .713.108 1.07.324.357.216.536.54.536.973v.848c0 2.05-.438 3.597-1.314 4.641-.876 1.044-2.11 1.566-3.701 1.566-1.795 0-3.272-.66-4.432-1.98-1.16-1.32-1.74-3.079-1.74-5.279 0-2.23.596-3.98 1.788-5.249 1.192-1.27 2.656-1.905 4.391-1.905 1.574 0 2.891.51 3.951 1.53 1.06 1.02 1.54 2.21 1.44 3.57 0 .56-.262 1.018-.787 1.374z"/></svg> },
    { key: "stackoverflow", href: social.stackoverflow, icon: <svg className={s} viewBox="0 0 24 24" fill="currentColor"><path d="M21.008 0c1.105 0 2 .895 2 2v20c0 1.105-.895 2-2 2H2.998c-1.105 0-2-.895-2-2V2c0-1.105.895-2 2-2h18.01zM8.947 5.356H5.663v12.29h3.284V5.356zm1.905 0v12.29h1.98c2.586 0 3.972-1.469 3.972-3.934 0-2.022-1.18-3.28-2.933-3.392 1.418-.275 2.574-1.575 2.574-3.03 0-2.138-1.34-3.934-3.605-3.934h-1.988zm1.417 5.39c.932 0 1.56.53 1.56 1.557 0 1.025-.628 1.555-1.56 1.555h-1.242v-3.112h1.242zm-.175-4.153c.75 0 1.29.479 1.29 1.341 0 .866-.54 1.34-1.29 1.34h-1.067V6.593h1.067z"/></svg> },
  ];
  return (<div className="flex flex-wrap gap-x-3 gap-y-1" style={{ color }}>{links.map(({ key, href, icon }) => href && (<a key={key} href={href.startsWith("http") ? href : `https://${href}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 hover:underline">{icon}<span className={size === "xs" ? "text-xs" : "text-sm"}>{href.replace(/^https?:\/\//, "")}</span></a>))}</div>);
}

export function levelToDots(level: string | undefined): number {
  switch (level) { case "Expert": return 4; case "Advanced": return 3; case "Intermediate": return 2; case "Beginner": return 1; default: return 2; }
}
