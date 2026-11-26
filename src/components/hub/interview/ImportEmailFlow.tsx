"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { Mail, Search, ShieldCheck, TriangleAlert, CircleCheck } from "lucide-react";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Field, Input, Select, Textarea } from "@/components/ui/Input";
import { apiFetch, ApiError } from "@/lib/interview/client";
import {
  EXTRACTION_FIELDS,
  EXTRACTION_FIELD_LABELS,
  INTERVIEW_TYPES,
  type ExtractionField,
} from "@/lib/interview/constants";

type FieldState = {
  value: string | number | string[] | null;
  evidence: string;
  confidence: number;
  origin: "explicit" | "inferred";
};

type ExtractionResponse = {
  fields: Record<string, FieldState>;
  notes: string[];
  suspicious: boolean;
  sourceType: string;
  subject?: string | null;
  sender?: string | null;
  truncated?: boolean;
};

type ConnectionStatus = {
  provider: "google" | "microsoft";
  configured: boolean;
  connected: boolean;
  accountEmail: string | null;
};

type MailSummary = { id: string; subject: string; from: string; receivedAt: string | null; snippet: string };

const TABS = [
  { id: "paste", label: "Paste email" },
  { id: "upload", label: "Upload file" },
  { id: "google", label: "Gmail" },
  { id: "microsoft", label: "Outlook" },
] as const;

type TabId = (typeof TABS)[number]["id"];

function toDisplay(value: FieldState["value"]): string {
  if (value === null || value === undefined) return "";
  if (Array.isArray(value)) return value.join(", ");
  return String(value);
}

function toDateTimeLocal(value: FieldState["value"]): string {
  const raw = toDisplay(value);
  if (!raw) return "";
  const parsed = new Date(raw);
  if (Number.isNaN(parsed.getTime())) return "";
  const offset = parsed.getTimezoneOffset() * 60_000;
  return new Date(parsed.getTime() - offset).toISOString().slice(0, 16);
}

export default function ImportEmailFlow({
  connectedProvider,
  connectionError,
}: {
  connectedProvider?: string;
  connectionError?: string;
}) {
  const router = useRouter();
  const [tab, setTab] = useState<TabId>("paste");
  const [content, setContent] = useState("");
  const [subject, setSubject] = useState("");
  const [sender, setSender] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(connectionError ?? null);
  const [extraction, setExtraction] = useState<ExtractionResponse | null>(null);
  const [values, setValues] = useState<Record<string, string>>({});
  const [interviewType, setInterviewType] = useState("technical_interview");
  const [connections, setConnections] = useState<ConnectionStatus[]>([]);
  const [searchQuery, setSearchQuery] = useState("interview invitation");
  const [results, setResults] = useState<MailSummary[]>([]);
  const [saving, setSaving] = useState(false);

  const loadConnections = useCallback(async () => {
    try {
      const data = await apiFetch<{ providers: ConnectionStatus[] }>("/api/interview/connections");
      setConnections(data.providers);
    } catch {
      setConnections([]);
    }
  }, []);

  function applyExtraction(result: ExtractionResponse) {
    setExtraction(result);
    const next: Record<string, string> = {};
    for (const field of EXTRACTION_FIELDS) {
      next[field] = field === "interviewDate"
        ? toDateTimeLocal(result.fields[field]?.value ?? null)
        : toDisplay(result.fields[field]?.value ?? null);
    }
    setValues(next);
    const type = toDisplay(result.fields.interviewType?.value ?? "");
    if (INTERVIEW_TYPES.some((entry) => entry.value === type)) setInterviewType(type);
  }

  async function extractPasted() {
    setBusy(true);
    setError(null);
    try {
      const result = await apiFetch<ExtractionResponse>("/api/interview/import/extract", {
        method: "POST",
        body: JSON.stringify({ content, subject: subject || null, sender: sender || null, sourceType: "paste" }),
      });
      applyExtraction(result);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not read that email.");
    } finally {
      setBusy(false);
    }
  }

  async function uploadFile(file: File) {
    setBusy(true);
    setError(null);
    try {
      const form = new FormData();
      form.append("file", file);
      const result = await apiFetch<ExtractionResponse>("/api/interview/import/file", {
        method: "POST",
        body: form,
      });
      setSubject(result.subject ?? file.name);
      setSender(result.sender ?? "");
      applyExtraction(result);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not read that file.");
    } finally {
      setBusy(false);
    }
  }

  async function connect(provider: "google" | "microsoft") {
    setError(null);
    try {
      const data = await apiFetch<{ authUrl: string }>(`/api/interview/connections/${provider}`, {
        method: "POST",
      });
      window.location.href = data.authUrl;
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not start the connection.");
    }
  }

  async function disconnect(provider: "google" | "microsoft") {
    try {
      await apiFetch(`/api/interview/connections/${provider}`, { method: "DELETE" });
      await loadConnections();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not disconnect.");
    }
  }

  async function searchMailbox(provider: "google" | "microsoft") {
    setBusy(true);
    setError(null);
    setResults([]);
    try {
      const data = await apiFetch<{ messages: MailSummary[] }>(
        `/api/interview/mailbox/${provider}/search`,
        { method: "POST", body: JSON.stringify({ query: searchQuery }) },
      );
      setResults(data.messages);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not search that mailbox.");
    } finally {
      setBusy(false);
    }
  }

  async function importMessage(provider: "google" | "microsoft", messageId: string) {
    setBusy(true);
    setError(null);
    try {
      const result = await apiFetch<ExtractionResponse>(`/api/interview/mailbox/${provider}/message`, {
        method: "POST",
        body: JSON.stringify({ messageId }),
      });
      setSubject(result.subject ?? "");
      setSender(result.sender ?? "");
      applyExtraction({ ...result, sourceType: provider === "google" ? "gmail" : "outlook" });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not read that message.");
    } finally {
      setBusy(false);
    }
  }

  async function saveProfile() {
    if (!extraction) return;
    setSaving(true);
    setError(null);
    try {
      const requiredSkills = (values.requiredSkills ?? "")
        .split(",")
        .map((entry) => entry.trim())
        .filter(Boolean);

      const payload = {
        companyName: (values.company ?? "").trim() || "Unknown company",
        jobTitle: (values.jobTitle ?? "").trim() || "Unknown role",
        experienceYears: values.experienceYears ? Number(values.experienceYears) : null,
        jobDescription: values.jobDescription?.trim() || null,
        requiredSkills,
        preferredSkills: [],
        interviewDate: values.interviewDate ? new Date(values.interviewDate).toISOString() : null,
        timezone: values.timezone?.trim() || "UTC",
        durationMinutes: values.durationMinutes ? Number(values.durationMinutes) : null,
        interviewRound: values.roundName?.trim() || null,
        interviewFormat: "unknown",
        interviewType,
        notes: [values.recruiterName ? `Recruiter: ${values.recruiterName}` : "", values.meetingPlatform ? `Platform: ${values.meetingPlatform}` : ""]
          .filter(Boolean)
          .join("\n") || null,
        source: extraction.sourceType === "upload" ? "email_upload" : extraction.sourceType === "gmail" ? "gmail" : extraction.sourceType === "outlook" ? "outlook" : "email_paste",
      };

      const created = await apiFetch<{ profile: { id: string } }>("/api/interview/profiles", {
        method: "POST",
        body: JSON.stringify(payload),
      });

      await apiFetch("/api/interview/emails", {
        method: "POST",
        body: JSON.stringify({
          interviewProfileId: created.profile.id,
          content: content || "Imported from file/mailbox",
          subject: subject || null,
          sender: sender || null,
          sourceType: extraction.sourceType,
          extractedFields: extraction.fields,
        }),
      }).catch(() => undefined);

      router.push(`/interview-preparation/${created.profile.id}`);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not save the interview profile.");
      setSaving(false);
    }
  }

  const activeConnection = tab === "google" || tab === "microsoft" ? connections.find((entry) => entry.provider === tab) : undefined;

  return (
    <div className="space-y-5">
      {error && (
        <div role="alert" className="rounded-md border border-danger/40 bg-danger/10 px-3 py-2 text-secondary-size text-danger">
          {error}
        </div>
      )}

      {connectedProvider && (
        <div className="flex items-center gap-2 rounded-md border border-success/40 bg-success/10 px-3 py-2 text-secondary-size text-success">
          <CircleCheck className="h-4 w-4" />
          Mailbox connected. Search for the invitation below.
        </div>
      )}

      <div role="tablist" aria-label="Import source" className="flex flex-wrap gap-1 rounded-lg border border-subtle bg-surface p-1">
        {TABS.map((entry) => (
          <button
            key={entry.id}
            role="tab"
            type="button"
            aria-selected={tab === entry.id}
            onClick={() => {
              setTab(entry.id);
              if (entry.id === "google" || entry.id === "microsoft") void loadConnections();
            }}
            className={
              tab === entry.id
                ? "rounded-md bg-brand-soft px-3 py-1.5 text-label font-semibold text-ink"
                : "rounded-md px-3 py-1.5 text-label text-ink-secondary transition-colors hover:text-ink"
            }
          >
            {entry.label}
          </button>
        ))}
      </div>

      {tab === "paste" && (
        <Card padding="md">
          <div className="grid gap-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Subject" htmlFor="subject">
                <Input id="subject" value={subject} onChange={(event) => setSubject(event.target.value)} placeholder="Interview invitation" />
              </Field>
              <Field label="Sender" htmlFor="sender">
                <Input id="sender" value={sender} onChange={(event) => setSender(event.target.value)} placeholder="recruiter@company.com" />
              </Field>
            </div>
            <Field label="Email body" htmlFor="content" required hint="Paste the full invitation. Only the details in the text are extracted.">
              <Textarea
                id="content"
                rows={10}
                value={content}
                onChange={(event) => setContent(event.target.value)}
                placeholder="Paste the interview invitation email here…"
              />
            </Field>
            <div className="flex justify-end">
              <Button onClick={extractPasted} loading={busy} disabled={content.trim().length < 20} icon={<Mail className="h-4 w-4" />}>
                Extract details
              </Button>
            </div>
          </div>
        </Card>
      )}

      {tab === "upload" && (
        <Card padding="md">
          <div className="space-y-3">
            <Field label="Invitation file" htmlFor="file" hint=".txt, .eml, .pdf or .docx — up to 8 MB. Outlook .msg is not supported; export as .eml or PDF.">
              <Input
                id="file"
                type="file"
                accept=".txt,.eml,.pdf,.docx"
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (file) void uploadFile(file);
                }}
              />
            </Field>
            {busy && <p className="text-secondary-size text-ink-muted">Reading the document…</p>}
            <p className="flex items-start gap-2 text-meta text-ink-muted">
              <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              Files are parsed in memory on the server and never stored.
            </p>
          </div>
        </Card>
      )}

      {(tab === "google" || tab === "microsoft") && (
        <Card padding="md">
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h2 className="text-card text-ink">{tab === "google" ? "Gmail" : "Outlook"}</h2>
                <p className="mt-1 text-secondary-size text-ink-secondary">
                  Read-only access. Patorbit can search your mailbox when you ask it to and read only the
                  message you select. It never sends, replies, deletes or scans in the background.
                </p>
              </div>
              <Badge tone={activeConnection?.connected ? "success" : activeConnection?.configured ? "warning" : "neutral"} dot>
                {activeConnection?.connected
                  ? "Connected"
                  : activeConnection?.configured
                    ? "Not connected"
                    : "Not configured"}
              </Badge>
            </div>

            {!activeConnection?.configured ? (
              <div className="rounded-lg border border-dashed border-line p-4 text-secondary-size text-ink-secondary">
                <p className="flex items-center gap-2 font-semibold text-ink">
                  <TriangleAlert className="h-4 w-4" /> {tab === "google" ? "Gmail" : "Outlook"} access is not configured on this deployment.
                </p>
                <p className="mt-2">
                  Add {tab === "google" ? "GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET" : "MICROSOFT_CLIENT_ID, MICROSOFT_CLIENT_SECRET and MICROSOFT_TENANT_ID"} to the server environment, then register the callback URL{" "}
                  <code className="rounded bg-white/[0.06] px-1 py-0.5 text-meta">
                    /api/interview/connections/{tab}/callback
                  </code>
                  . Paste and upload work fully without this.
                </p>
              </div>
            ) : activeConnection.connected ? (
              <div className="space-y-3">
                <div className="flex flex-wrap items-end gap-2">
                  <Field label="Search your mailbox" htmlFor="mailSearch" className="flex-1">
                    <Input id="mailSearch" value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} />
                  </Field>
                  <Button variant="secondary" onClick={() => searchMailbox(tab)} loading={busy} icon={<Search className="h-4 w-4" />}>
                    Search
                  </Button>
                  <Button variant="ghost" onClick={() => disconnect(tab)}>
                    Disconnect
                  </Button>
                </div>
                {results.length > 0 && (
                  <ul className="divide-y divide-subtle rounded-lg border border-subtle">
                    {results.map((message) => (
                      <li key={message.id} className="flex flex-col gap-1 p-3 sm:flex-row sm:items-center sm:justify-between">
                        <div className="min-w-0">
                          <p className="truncate text-body font-medium text-ink">{message.subject}</p>
                          <p className="truncate text-label text-ink-secondary">
                            {message.from}
                            {message.receivedAt ? ` · ${new Date(message.receivedAt).toLocaleDateString()}` : ""}
                          </p>
                        </div>
                        <Button size="sm" variant="secondary" onClick={() => importMessage(tab, message.id)} loading={busy}>
                          Use this email
                        </Button>
                      </li>
                    ))}
                  </ul>
                )}
                {results.length === 0 && !busy && (
                  <p className="text-secondary-size text-ink-muted">
                    No messages selected yet. Search, then choose the invitation to import.
                  </p>
                )}
              </div>
            ) : (
              <Button onClick={() => connect(tab)} icon={<Mail className="h-4 w-4" />}>
                Connect {tab === "google" ? "Gmail" : "Outlook"}
              </Button>
            )}
          </div>
        </Card>
      )}

      {extraction && (
        <Card padding="md">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <h2 className="text-card text-ink">Review extracted details</h2>
              <p className="mt-1 text-secondary-size text-ink-secondary">
                Every field below is editable. Fields marked <Badge tone="info">Inferred</Badge> were
                deduced, not stated — check them before saving.
              </p>
            </div>
            <Badge tone={extraction.suspicious ? "warning" : "neutral"}>
              {extraction.suspicious ? "Unusual instructions ignored" : `${Object.values(extraction.fields).filter((field) => field.value !== null).length} fields found`}
            </Badge>
          </div>

          {extraction.notes.length > 0 && (
            <ul className="mt-3 space-y-1 rounded-md border border-subtle bg-white/[0.02] p-3 text-meta text-ink-secondary">
              {extraction.notes.map((note) => (
                <li key={note}>{note}</li>
              ))}
            </ul>
          )}

          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <Field label="Company" htmlFor="ex-company">
              <Input id="ex-company" value={values.company ?? ""} onChange={(event) => setValues({ ...values, company: event.target.value })} />
            </Field>
            <Field label="Job title" htmlFor="ex-title">
              <Input id="ex-title" value={values.jobTitle ?? ""} onChange={(event) => setValues({ ...values, jobTitle: event.target.value })} />
            </Field>
            <Field label="Interview type" htmlFor="ex-type">
              <Select id="ex-type" value={interviewType} onChange={(event) => setInterviewType(event.target.value)}>
                {INTERVIEW_TYPES.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Interview date" htmlFor="ex-date">
              <Input id="ex-date" type="datetime-local" value={values.interviewDate ?? ""} onChange={(event) => setValues({ ...values, interviewDate: event.target.value })} />
            </Field>
            <Field label="Timezone" htmlFor="ex-tz">
              <Input id="ex-tz" value={values.timezone ?? ""} onChange={(event) => setValues({ ...values, timezone: event.target.value })} />
            </Field>
            <Field label="Duration (minutes)" htmlFor="ex-duration">
              <Input id="ex-duration" type="number" value={values.durationMinutes ?? ""} onChange={(event) => setValues({ ...values, durationMinutes: event.target.value })} />
            </Field>
            <Field label="Round name" htmlFor="ex-round">
              <Input id="ex-round" value={values.roundName ?? ""} onChange={(event) => setValues({ ...values, roundName: event.target.value })} />
            </Field>
            <Field label="Required skills" htmlFor="ex-skills" hint="Comma separated.">
              <Input id="ex-skills" value={values.requiredSkills ?? ""} onChange={(event) => setValues({ ...values, requiredSkills: event.target.value })} />
            </Field>
            <Field label="Recruiter / interviewer" htmlFor="ex-recruiter">
              <Input id="ex-recruiter" value={values.recruiterName ?? ""} onChange={(event) => setValues({ ...values, recruiterName: event.target.value })} />
            </Field>
            <Field label="Meeting platform" htmlFor="ex-platform">
              <Input id="ex-platform" value={values.meetingPlatform ?? ""} onChange={(event) => setValues({ ...values, meetingPlatform: event.target.value })} />
            </Field>
          </div>

          <div className="mt-4 grid gap-4">
            <Field label="Job description / instructions" htmlFor="ex-jd">
              <Textarea id="ex-jd" rows={4} value={values.jobDescription ?? ""} onChange={(event) => setValues({ ...values, jobDescription: event.target.value })} />
            </Field>
          </div>

          <details className="mt-4 rounded-lg border border-subtle p-3">
            <summary className="cursor-pointer text-label font-semibold text-ink-secondary">
              Field evidence and confidence
            </summary>
            <ul className="mt-2 space-y-2 text-meta text-ink-secondary">
              {(EXTRACTION_FIELDS as readonly ExtractionField[]).map((field) => {
                const entry = extraction.fields[field];
                if (!entry || entry.value === null) return null;
                return (
                  <li key={field}>
                    <span className="font-semibold text-ink">{EXTRACTION_FIELD_LABELS[field]}:</span>{" "}
                    {Math.round(entry.confidence * 100)}% · {entry.origin}
                    {entry.evidence ? ` — “${entry.evidence}”` : ""}
                  </li>
                );
              })}
            </ul>
          </details>

          <div className="mt-5 flex justify-end">
            <Button onClick={saveProfile} loading={saving}>
              Save interview profile
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
}
