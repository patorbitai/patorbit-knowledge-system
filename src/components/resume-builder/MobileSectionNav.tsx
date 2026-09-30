"use client";

import { useEffect, useRef } from "react";
import { clsx } from "clsx";
import {
  User,
  Briefcase,
  GraduationCap,
  Zap,
  FolderKanban,
  Award,
  Trophy,
  Globe,
  Link2,
  Eye,
} from "lucide-react";
import { useResumeBuilder } from "@/store/resume-builder";
import type { SectionId } from "@/types/resume";

const sections: Array<{
  id: SectionId;
  label: string;
  Icon: React.ComponentType<{ className?: string }>;
}> = [
  { id: "personal", label: "Profile", Icon: User },
  { id: "experience", label: "Experience", Icon: Briefcase },
  { id: "education", label: "Education", Icon: GraduationCap },
  { id: "skills", label: "Skills", Icon: Zap },
  { id: "projects", label: "Projects", Icon: FolderKanban },
  { id: "certifications", label: "Certifications", Icon: Award },
  { id: "achievements", label: "Achievements", Icon: Trophy },
  { id: "languages", label: "Languages", Icon: Globe },
  { id: "portfolio", label: "Portfolio", Icon: Link2 },
  { id: "review", label: "Review", Icon: Eye },
];

export default function MobileSectionNav() {
  const activeSection = useResumeBuilder((s) => s.activeSection);
  const setActiveSection = useResumeBuilder((s) => s.setActiveSection);
  const sectionComplete = useResumeBuilder((s) => s.sectionComplete);
  const navRef = useRef<HTMLElement>(null);

  // M5G D7 — the strip scrolls horizontally, so the active chip can sit
  // off-screen (e.g. switching to "Portfolio" left it at left=818 in a 768px
  // nav). Center it in the strip whenever the active section changes.
  useEffect(() => {
    const nav = navRef.current;
    if (!nav) return;
    const active = nav.querySelector<HTMLElement>('[aria-current="step"]');
    if (!active) return;
    const delta = active.getBoundingClientRect().left - nav.getBoundingClientRect().left;
    nav.scrollLeft = Math.max(0, nav.scrollLeft + delta - (nav.clientWidth - active.offsetWidth) / 2);
  }, [activeSection]);

  return (
    <nav
      ref={navRef}
      className="xl:hidden flex overflow-x-auto gap-1 border-t border-gray-200 dark:border-white/[0.06] bg-white dark:bg-[#070d18] px-2 py-1.5 scrollbar-none"
      aria-label="Resume sections"
      style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
    >
      {sections.map(({ id, label, Icon }) => {
        const isActive = activeSection === id;
        const isComplete = id !== "review" && sectionComplete(id as Exclude<SectionId, "review">);
        return (
          <button
            key={id}
            type="button"
            onClick={() => setActiveSection(id)}
            aria-current={isActive ? "step" : undefined}
            className={clsx(
              "relative flex shrink-0 items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors",
              isActive
                ? "text-cyan-700 dark:text-cyan-400"
                : "text-gray-400 dark:text-slate-500 hover:bg-gray-100 dark:hover:bg-white/[0.05] hover:text-gray-700 dark:hover:text-slate-200"
            )}
          >
            <Icon className="h-3.5 w-3.5" />
            {label}
            {isComplete && (
              <span
                aria-hidden="true"
                className="absolute -top-0.5 -right-0.5 h-1.5 w-1.5 rounded-full bg-emerald-400"
              />
            )}
          </button>
        );
      })}
    </nav>
  );
}
