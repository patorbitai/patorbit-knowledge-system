"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Sparkles } from "lucide-react";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import { Field, Input, Select, Textarea } from "@/components/ui/Input";
import { apiFetch, ApiError } from "@/lib/interview/client";
import {
  INTERVIEW_FORMATS,
  INTERVIEW_TYPES,
  SENIORITY_LEVELS,
} from "@/lib/interview/constants";

export interface ApplicationOption {
  applicationId: string;
  companyName: string;
  title: string;
  jobDescription: string;
  status: string;
}

export interface ProfileInitialValues {
  id?: string;
  applicationId: string;
  companyName: string;
  jobTitle: string;
  experienceYears: string;
  seniority: string;
  interviewType: string;
  interviewFormat: string;
  interviewDate: string;
  timezone: string;
  durationMinutes: string;
  interviewRound: string;
  requiredSkills: string;
  preferredSkills: string;
  jobDescription: string;
  notes: string;
}

const EMPTY: ProfileInitialValues = {
  applicationId: "",
  companyName: "",
  jobTitle: "",
  experienceYears: "",
  seniority: "",
  interviewType: "technical_interview",
  interviewFormat: "video",
  interviewDate: "",
  timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC",
  durationMinutes: "60",
  interviewRound: "Round 1",
  requiredSkills: "",
  preferredSkills: "",
  jobDescription: "",
  notes: "",
};

function splitList(value: string): string[] {
  return value
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean)
    .slice(0, 40);
}

/**
 * Create or edit an interview profile. When a tracked application is chosen,
 * its company, role and description are reused instead of retyped.
 */
export default function CreateProfileForm({
  applications,
  initial,
  mode = "create",
}: {
  applications: ApplicationOption[];
  initial?: Partial<ProfileInitialValues>;
  mode?: "create" | "edit";
}) {
  const router = useRouter();
  const [values, setValues] = useState<ProfileInitialValues>({ ...EMPTY, ...initial });
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const selectedApplication = useMemo(
    () => applications.find((application) => application.applicationId === values.applicationId) ?? null,
    [applications, values.applicationId],
  );

  const set = <K extends keyof ProfileInitialValues>(key: K, value: ProfileInitialValues[K]) =>
    setValues((current) => ({ ...current, [key]: value }));

  function applyApplication(applicationId: string) {
    const application = applications.find((entry) => entry.applicationId === applicationId);
    setValues((current) => ({
      ...current,
      applicationId,
      companyName: application?.companyName ?? current.companyName,
      jobTitle: application?.title ?? current.jobTitle,
      jobDescription: application?.jobDescription || current.jobDescription,
    }));
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setSaving(true);
    try {
      const payload = {
        applicationId: values.applicationId || null,
        companyName: values.companyName.trim(),
        jobTitle: values.jobTitle.trim(),
        experienceYears: values.experienceYears ? Number(values.experienceYears) : null,
        jobDescription: values.jobDescription.trim() || null,
        requiredSkills: splitList(values.requiredSkills),
        preferredSkills: splitList(values.preferredSkills),
        seniority: values.seniority || null,
        interviewDate: values.interviewDate ? new Date(values.interviewDate).toISOString() : null,
        timezone: values.timezone.trim() || "UTC",
        durationMinutes: values.durationMinutes ? Number(values.durationMinutes) : null,
        interviewRound: values.interviewRound.trim() || null,
        interviewFormat: values.interviewFormat,
        interviewType: values.interviewType,
        notes: values.notes.trim() || null,
        source: values.applicationId ? "application" : "manual",
      };

      if (mode === "edit" && initial?.id) {
        await apiFetch(`/api/interview/profiles/${initial.id}`, {
          method: "PATCH",
          body: JSON.stringify(payload),
        });
        router.refresh();
        router.push(`/interview-preparation/${initial.id}`);
      } else {
        const result = await apiFetch<{ profile: { id: string } }>("/api/interview/profiles", {
          method: "POST",
          body: JSON.stringify(payload),
        });
        router.push(`/interview-preparation/${result.profile.id}`);
      }
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not save the interview profile.");
      setSaving(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      {error && (
        <div role="alert" className="rounded-md border border-danger/40 bg-danger/10 px-3 py-2 text-secondary-size text-danger">
          {error}
        </div>
      )}

      <Card padding="md">
        <h2 className="text-card text-ink">Role and company</h2>
        <p className="mt-1 text-secondary-size text-ink-secondary">
          Link an existing application to reuse its company, role and description.
        </p>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <Field label="Existing job application" htmlFor="applicationId" hint={selectedApplication ? "Company, role and description are filled from this application." : "Optional — you can enter the details manually."}>
            <Select
              id="applicationId"
              value={values.applicationId}
              onChange={(event) => applyApplication(event.target.value)}
            >
              <option value="">No linked application</option>
              {applications.map((application) => (
                <option key={application.applicationId} value={application.applicationId}>
                  {application.companyName} — {application.title}
                </option>
              ))}
            </Select>
          </Field>

          <Field label="Company" htmlFor="companyName" required>
            <Input
              id="companyName"
              required
              value={values.companyName}
              onChange={(event) => set("companyName", event.target.value)}
              placeholder="e.g. Contoso"
            />
          </Field>

          <Field label="Job title" htmlFor="jobTitle" required>
            <Input
              id="jobTitle"
              required
              value={values.jobTitle}
              onChange={(event) => set("jobTitle", event.target.value)}
              placeholder="e.g. Senior Data Engineer"
            />
          </Field>

          <Field label="Years of experience" htmlFor="experienceYears" hint="Required experience for the role.">
            <Input
              id="experienceYears"
              type="number"
              min={0}
              max={60}
              step="0.5"
              value={values.experienceYears}
              onChange={(event) => set("experienceYears", event.target.value)}
            />
          </Field>

          <Field label="Seniority" htmlFor="seniority">
            <Select id="seniority" value={values.seniority} onChange={(event) => set("seniority", event.target.value)}>
              <option value="">Not specified</option>
              {SENIORITY_LEVELS.map((level) => (
                <option key={level} value={level}>
                  {level}
                </option>
              ))}
            </Select>
          </Field>
        </div>
      </Card>

      <Card padding="md">
        <h2 className="text-card text-ink">Interview details</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <Field label="Interview type" htmlFor="interviewType" required>
            <Select
              id="interviewType"
              value={values.interviewType}
              onChange={(event) => set("interviewType", event.target.value)}
            >
              {INTERVIEW_TYPES.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </Select>
          </Field>

          <Field label="Format" htmlFor="interviewFormat">
            <Select
              id="interviewFormat"
              value={values.interviewFormat}
              onChange={(event) => set("interviewFormat", event.target.value)}
            >
              {INTERVIEW_FORMATS.map((format) => (
                <option key={format.value} value={format.value}>
                  {format.label}
                </option>
              ))}
            </Select>
          </Field>

          <Field label="Round name" htmlFor="interviewRound" hint="e.g. Round 1, Technical screening">
            <Input
              id="interviewRound"
              value={values.interviewRound}
              onChange={(event) => set("interviewRound", event.target.value)}
            />
          </Field>

          <Field label="Duration (minutes)" htmlFor="durationMinutes">
            <Input
              id="durationMinutes"
              type="number"
              min={5}
              max={600}
              value={values.durationMinutes}
              onChange={(event) => set("durationMinutes", event.target.value)}
            />
          </Field>

          <Field label="Date and time" htmlFor="interviewDate">
            <Input
              id="interviewDate"
              type="datetime-local"
              value={values.interviewDate}
              onChange={(event) => set("interviewDate", event.target.value)}
            />
          </Field>

          <Field label="Timezone" htmlFor="timezone" hint="IANA name, e.g. Asia/Kolkata.">
            <Input
              id="timezone"
              value={values.timezone}
              onChange={(event) => set("timezone", event.target.value)}
            />
          </Field>
        </div>
      </Card>

      <Card padding="md">
        <h2 className="text-card text-ink">Skills and context</h2>
        <div className="mt-4 grid gap-4">
          <Field label="Required skills" htmlFor="requiredSkills" hint="Comma separated. Drives question categories.">
            <Input
              id="requiredSkills"
              value={values.requiredSkills}
              onChange={(event) => set("requiredSkills", event.target.value)}
              placeholder="SQL, Python, PySpark, Azure"
            />
          </Field>

          <Field label="Preferred skills" htmlFor="preferredSkills" hint="Comma separated.">
            <Input
              id="preferredSkills"
              value={values.preferredSkills}
              onChange={(event) => set("preferredSkills", event.target.value)}
              placeholder="Databricks, Airflow"
            />
          </Field>

          <Field label="Job description" htmlFor="jobDescription">
            <Textarea
              id="jobDescription"
              rows={6}
              value={values.jobDescription}
              onChange={(event) => set("jobDescription", event.target.value)}
              placeholder="Paste the job description so questions match the role."
            />
          </Field>

          <Field label="Additional notes" htmlFor="notes" hint="Anything the interviewer mentioned.">
            <Textarea
              id="notes"
              rows={3}
              value={values.notes}
              onChange={(event) => set("notes", event.target.value)}
            />
          </Field>
        </div>
      </Card>

      <div className="flex flex-wrap items-center justify-end gap-2">
        <Button type="button" variant="ghost" onClick={() => router.back()}>
          Cancel
        </Button>
        <Button type="submit" loading={saving} icon={<Sparkles className="h-4 w-4" />}>
          {mode === "edit" ? "Save changes" : "Create interview profile"}
        </Button>
      </div>
    </form>
  );
}
