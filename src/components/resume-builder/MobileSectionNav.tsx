"use client";

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
  { id: "personal", label: "Personal", Icon: User },
  { id: "experience", label: "Experience", Icon: Briefcase },
  { id: "education", label: "Education", Icon: GraduationCap },
  { id: "skills", label: "Skills", Icon: Zap },
  { id: "projects", label: "Projects", Icon: FolderKanban },
  { id: "certifications", label: "Certs", Icon: Award },
  { id: "achievements", label: "Achievements", Icon: Trophy },
  { id: "languages", label: "Languages", Icon: Globe },
  { id: "portfolio", label: "Portfolio", Icon: Link2 },
  { id: "review", label: "Review", Icon: Eye },
];

export default function MobileSectionNav() {
  const activeSection = useResumeBuilder((s) => s.activeSection);
  const setActiveSection = useResumeBuilder((s) => s.setActiveSection);

  return (
    <nav
      className="md:hidden flex overflow-x-auto gap-1 border-t border-white/[0.06] bg-[#080C18] px-2 py-2"
      aria-label="Resume sections"
    >
      {sections.map(({ id, label, Icon }) => {
        const isActive = activeSection === id;
        return (
          <button
            key={id}
            type="button"
            onClick={() => setActiveSection(id)}
            aria-current={isActive ? "step" : undefined}
            className={clsx(
              "flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium transition-colors",
              isActive
                ? "bg-cyan-500/15 text-cyan-300"
                : "text-slate-400 hover:bg-white/[0.05] hover:text-slate-200"
            )}
          >
            <Icon className="h-3.5 w-3.5" />
            {label}
          </button>
        );
      })}
    </nav>
  );
}
