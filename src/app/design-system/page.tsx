import type { Metadata } from "next";
import {
  Briefcase,
  FileText,
  Sparkles,
  Upload,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Info,
} from "lucide-react";
import Button from "@/components/ui/Button";
import Card, { CardHeader } from "@/components/ui/Card";
import { Input, Textarea, Select, Field } from "@/components/ui/Input";
import {
  Badge,
  StatusBadge,
  ProvenanceBadge,
} from "@/components/ui/Badge";
import { ScoreIndicator, ProgressBar, matchTone } from "@/components/ui/ScoreIndicator";
import { Alert, Skeleton, SkeletonCard, EmptyState } from "@/components/ui/Feedback";
import { Tabs } from "@/components/ui/Tabs";
import { Timeline } from "@/components/ui/Timeline";
import { Tooltip } from "@/components/ui/Tooltip";

export const metadata: Metadata = {
  title: "Design System — Patorbit",
  robots: { index: false },
};

function Section({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-section text-ink">{title}</h2>
        {description && (
          <p className="mt-1 text-secondary-size text-ink-secondary">
            {description}
          </p>
        )}
      </div>
      <Card padding="lg" className="space-y-5">
        {children}
      </Card>
    </section>
  );
}

const SWATCHES: { label: string; varName: string; note: string }[] = [
  { label: "Brand", varName: "--brand", note: "One primary. Actions, links, focus." },
  { label: "Success", varName: "--status-success", note: "Verified, supported, accepted, exported." },
  { label: "Warning", varName: "--status-warning", note: "Needs evidence, partial, needs review." },
  { label: "Danger", varName: "--status-danger", note: "Invalid, blocked, failed, missing." },
  { label: "Info", varName: "--status-info", note: "Imported, informational." },
  { label: "Match strong", varName: "--match-strong", note: "Score ≥ 75." },
  { label: "Match partial", varName: "--match-partial", note: "Score 40–74." },
  { label: "Match gap", varName: "--match-gap", note: "Score < 40." },
];

const SURFACES: { label: string; cls: string }[] = [
  { label: "sunken (--surface-base)", cls: "bg-surface-sunken" },
  { label: "raised (--surface-raised)", cls: "bg-surface-raised" },
  { label: "card (--surface-card)", cls: "bg-surface" },
  { label: "overlay (--surface-overlay)", cls: "bg-surface-overlay" },
];

const TYPE_SCALE: { cls: string; label: string; sample: string }[] = [
  { cls: "text-display", label: "display", sample: "Your professional identity" },
  { cls: "text-page", label: "page", sample: "Job match overview" },
  { cls: "text-section", label: "section", sample: "Evidence supporting this match" },
  { cls: "text-card", label: "card", sample: "Software Engineer — Brightloop" },
  { cls: "text-body", label: "body", sample: "Patorbit turns your experience into a profile you can adapt to every job." },
  { cls: "text-secondary-size", label: "secondary", sample: "Supporting text that explains without shouting." },
  { cls: "text-label", label: "label", sample: "REQUIRED PREFERRED" },
  { cls: "text-meta", label: "meta", sample: "Imported from resume · Sep 12, 2026" },
];

export default function DesignSystemPage() {
  return (
    <div className="min-h-screen bg-surface-sunken">
      <div className="mx-auto max-w-5xl space-y-10 px-4 py-10 sm:px-6 lg:px-8">
        <header className="space-y-2">
          <p className="text-label uppercase tracking-widest text-brand">
            Patorbit internal
          </p>
          <h1 className="text-page text-ink">Design system</h1>
          <p className="max-w-2xl text-body text-ink-secondary">
            The visual reference for the entire application. Every screen is
            built from these tokens and components — if something is not here,
            it should not exist in the product.
          </p>
        </header>

        <Section
          title="Typography"
          description="Hierarchy comes from the type scale — not from borders and boxes."
        >
          <div className="space-y-4">
            {TYPE_SCALE.map((t) => (
              <div key={t.label} className="flex flex-col gap-1 border-b border-subtle pb-3 last:border-0">
                <span className="text-meta font-mono text-ink-muted">
                  {t.cls}
                </span>
                <p className={`${t.cls} text-ink`}>{t.sample}</p>
              </div>
            ))}
            <div>
              <span className="text-meta font-mono text-ink-muted">
                .tnum (tabular numbers)
              </span>
              <p className="tnum text-number text-ink">82% · 14/13 · 1,240</p>
            </div>
          </div>
        </Section>

        <Section
          title="Color"
          description="Color communicates meaning. Everything else stays neutral."
        >
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {SWATCHES.map((s) => (
              <div key={s.label} className="space-y-2">
                <div
                  className="h-12 rounded-lg border border-subtle"
                  style={{ background: `var(${s.varName})` }}
                />
                <p className="text-label text-ink">{s.label}</p>
                <p className="text-meta text-ink-muted">{s.note}</p>
              </div>
            ))}
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {SURFACES.map((s) => (
              <div
                key={s.label}
                className={`rounded-lg border border-subtle p-4 ${s.cls}`}
              >
                <p className="text-meta text-ink-secondary">{s.label}</p>
              </div>
            ))}
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-label text-ink-secondary">Text:</span>
            <span className="text-body text-ink">Primary</span>
            <span className="text-body text-ink-secondary">Secondary</span>
            <span className="text-body text-ink-muted">Muted</span>
          </div>
        </Section>

        <Section title="Buttons" description="Four variants, three sizes, one loading treatment.">
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-3">
              <Button>Primary</Button>
              <Button variant="secondary">Secondary</Button>
              <Button variant="ghost">Ghost</Button>
              <Button variant="danger">Danger</Button>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <Button size="sm">Small</Button>
              <Button size="md">Medium</Button>
              <Button size="lg">Large</Button>
              <Button loading>Analyzing</Button>
              <Button variant="secondary" icon={<Upload className="h-4 w-4" />}>
                Upload resume
              </Button>
              <Button disabled>Disabled</Button>
            </div>
          </div>
        </Section>

        <Section title="Form controls" description="One input style, with labels, hints, and error states.">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Company" htmlFor="ds-company" hint="Where you work or worked.">
              <Input id="ds-company" placeholder="Brightloop" />
            </Field>
            <Field label="Role" htmlFor="ds-role" required>
              <Input id="ds-role" placeholder="Software Engineer" defaultValue="" />
            </Field>
            <Field label="Status" htmlFor="ds-status">
              <Select id="ds-status" defaultValue="applied">
                <option value="saved">Saved</option>
                <option value="applied">Applied</option>
                <option value="interview">Interview</option>
              </Select>
            </Field>
            <Field
              label="Job description"
              htmlFor="ds-jd"
              error="Paste a job description to analyze."
            >
              <Textarea id="ds-jd" rows={3} />
            </Field>
          </div>
        </Section>

        <Section title="Badges & provenance" description="Plain language first. Never imply verification that does not exist.">
          <div className="flex flex-wrap items-center gap-2">
            <Badge>Neutral</Badge>
            <Badge tone="brand">Brand</Badge>
            <Badge tone="success" dot>Success</Badge>
            <Badge tone="warning" dot>Warning</Badge>
            <Badge tone="danger" dot>Danger</Badge>
            <Badge tone="info" dot>Info</Badge>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge status="Applied" />
            <StatusBadge status="Interview" />
            <StatusBadge status="Offer" />
            <StatusBadge status="Rejected" />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <ProvenanceBadge provenance="imported" />
            <ProvenanceBadge provenance="user-provided" />
            <ProvenanceBadge provenance="ai-suggested" />
            <ProvenanceBadge provenance="verified" />
          </div>
        </Section>

        <Section title="Score & progress" description="Meaningful, restrained, never a gaming score.">
          <div className="flex flex-wrap items-center gap-8">
            <ScoreIndicator value={82} statement="8 of 13 requirements supported" />
            <ScoreIndicator value={61} size="md" />
            <ScoreIndicator value={34} size="sm" />
          </div>
          <div className="max-w-md space-y-3">
            <ProgressBar value={72} label="Profile completeness" />
            <ProgressBar value={84} tone="success" label="Evidence coverage" />
            <ProgressBar value={41} tone="partial" label="Role readiness" />
          </div>
          <div className="flex flex-wrap gap-3 text-label">
            {([0, 34, 61, 82] as const).map((v) => (
              <span key={v} className="tnum text-ink-secondary">
                {v}% → {matchTone(v)}
              </span>
            ))}
          </div>
        </Section>

        <Section title="Cards">
          <div className="grid gap-4 sm:grid-cols-2">
            <Card>
              <CardHeader
                title="Default card"
                description="The standard surface."
              />
              <p className="text-body text-ink-secondary">
                Used everywhere. One card style, one border, one radius.
              </p>
            </Card>
            <Card variant="raised">
              <CardHeader
                title="Raised card"
                description="For emphasis without color."
                icon={Briefcase}
              />
              <p className="text-body text-ink-secondary">
                A touch more elevation for hero-adjacent content.
              </p>
            </Card>
            <Card variant="interactive">
              <CardHeader
                title="Interactive card"
                action={<Badge tone="brand">Link</Badge>}
              />
              <p className="text-body text-ink-secondary">
                Hover affordance for clickable containers.
              </p>
            </Card>
            <Card variant="ghost">
              <CardHeader title="Ghost card" description="Dashed outline for placeholders." />
              <p className="text-body text-ink-secondary">
                Reserved for not-yet-real content.
              </p>
            </Card>
          </div>
        </Section>

        <Section title="Tabs">
          <Tabs
            activeId="one"
            items={[
              { id: "one", label: "Overview", content: <p className="pt-4 text-body text-ink-secondary">Overview panel content.</p> },
              { id: "two", label: "Evidence", badge: <Badge tone="success">17</Badge>, content: <p className="pt-4 text-body text-ink-secondary">Evidence panel content.</p> },
              { id: "three", label: "History", content: <p className="pt-4 text-body text-ink-secondary">History panel content.</p> },
            ]}
          />
        </Section>

        <Section title="Timeline & tooltip">
          <div className="grid gap-8 sm:grid-cols-2">
            <Timeline
              items={[
                { id: "1", tone: "success", meta: "2024 — 2026", content: "Software Engineer — Brightloop" },
                { id: "2", tone: "brand", meta: "Sep 12, 2026", content: "Evidence added: led REST API migration" },
                { id: "3", tone: "warning", meta: "Sep 10, 2026", content: "AI suggested: emphasize API experience" },
                { id: "4", meta: "2021 — 2024", content: "Junior Developer — Northwind Labs" },
              ]}
            />
            <div className="flex items-center gap-4">
              <Tooltip content="Supported by: Software Engineer — 2024–2026">
                <button
                  type="button"
                  className="text-body text-brand underline decoration-dotted underline-offset-4"
                >
                  Hover for evidence
                </button>
              </Tooltip>
            </div>
          </div>
        </Section>

        <Section title="Alerts" description="What happened, what was preserved, what to do next.">
          <div className="space-y-3">
            <Alert tone="danger" title="We couldn't analyze this job description.">
              Your resume is safe. Try again or paste a shorter job description.
            </Alert>
            <Alert tone="warning" title="3 requirements have no supporting evidence.">
              Add evidence to strengthen your match — it takes a minute.
            </Alert>
            <Alert tone="success" title="Resume exported.">
              Your tailored version was saved with the changes you approved.
            </Alert>
            <Alert tone="info" title="This profile was imported from your resume.">
              Review each item — you can correct anything Patorbit misunderstood.
            </Alert>
          </div>
          <div className="flex flex-wrap items-center gap-3 text-ink-secondary">
            <span className="flex items-center gap-1.5"><CheckCircle2 className="h-4 w-4 text-success" /> success icon</span>
            <span className="flex items-center gap-1.5"><AlertTriangle className="h-4 w-4 text-warning" /> warning icon</span>
            <span className="flex items-center gap-1.5"><XCircle className="h-4 w-4 text-danger" /> error icon</span>
            <span className="flex items-center gap-1.5"><Info className="h-4 w-4 text-info" /> info icon</span>
          </div>
        </Section>

        <Section title="Empty states" description="Say what this area does, why it matters, and what to do next.">
          <div className="grid gap-4 sm:grid-cols-2">
            <EmptyState
              icon={Briefcase}
              title="No jobs yet"
              description="Analyze your first job to see how your profile matches the opportunity."
              cta={{ label: "Analyze a job", href: "/jobs/new" }}
            />
            <EmptyState
              icon={FileText}
              title="Your Professional Profile is waiting for you."
              description="Add your resume to create your first profile — Patorbit extracts experience, skills, and education."
              cta={{ label: "Upload resume", href: "/resume-builder" }}
            />
            <EmptyState
              icon={Sparkles}
              title="No tailored versions yet"
              description="Tailoring creates a copy for a specific job — your master profile stays untouched."
              cta={{ label: "Analyze a job", href: "/jobs/new" }}
              secondaryCta={{ label: "Open master resume", href: "/resume-builder" }}
            />
            <EmptyState
              icon={Upload}
              title="No evidence added yet"
              description="Evidence shows why Patorbit believes a skill or achievement — it makes your profile trustworthy."
              cta={{ label: "Add evidence", href: "/trust/evidence" }}
            />
          </div>
        </Section>

        <Section title="Loading" description="Skeletons for content, named stages for AI processing.">
          <div className="grid gap-4 sm:grid-cols-2">
            <SkeletonCard />
            <div className="space-y-3">
              <div className="space-y-2">
                <Skeleton className="h-3 w-48" />
                <Skeleton className="h-3 w-full" />
                <Skeleton className="h-3 w-2/3" />
              </div>
              <div className="space-y-2 rounded-lg border border-subtle p-4">
                <p className="text-label text-ink-secondary">AI processing stages</p>
                <p className="text-body text-ink">✓ Understanding your profile</p>
                <p className="text-body text-ink">✓ Reading the job requirements</p>
                <p className="text-body text-ink-secondary">◐ Comparing your experience</p>
                <p className="text-body text-ink-muted">○ Preparing recommendations</p>
              </div>
            </div>
          </div>
        </Section>
      </div>
    </div>
  );
}
