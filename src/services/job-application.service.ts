"use strict";

import { prisma } from "@/lib/prisma";
import { jobApplicationRepository, type JobApplicationRecord } from "@/repositories/job-application.repository";

/** Canonical API representation returned by the API. */
export interface JobApplicationData {
  applicationId: string;
  title: string;
  companyName: string;
  jobDescription: string;
  status: string;
  resumeId: string | null;
  matchScore: number | null;
  matchData: unknown;
  qualificationMatch: unknown;
  matchedResumeId: string | null;
  matchedAt: string | null;
  exportedResumeId: string | null;
  exportedAt: string | null;
  jobUrl: string | null;
  location: string | null;
  employmentType: string | null;
  appliedDate: string | null;
  followUpDate: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

/** Input for creating a job application. */
export interface CreateJobApplicationInput {
  title: string;
  companyName: string;
  jobDescription: string;
  resumeId?: string | null;
  jobUrl?: string | null;
  location?: string | null;
  employmentType?: string | null;
  appliedDate?: string | null;
  followUpDate?: string | null;
  notes?: string | null;
}

/** Input for updating a job application. */
export interface UpdateJobApplicationInput {
  title?: string;
  companyName?: string;
  jobDescription?: string;
  status?: string;
  resumeId?: string | null;
  matchScore?: number | null;
  matchData?: Record<string, unknown>;
  qualificationMatch?: Record<string, unknown> | null;
  matchedResumeId?: string | null;
  exportedResumeId?: string | null;
  jobUrl?: string | null;
  location?: string | null;
  employmentType?: string | null;
  appliedDate?: string | null;
  followUpDate?: string | null;
  notes?: string | null;
}

/** Valid application statuses. */
export const VALID_STATUSES = [
  "saved",
  "ready_to_apply",
  "applied",
  "interview",
  "offer",
  "rejected",
] as const;

export type ApplicationStatus = (typeof VALID_STATUSES)[number];

/** Valid employment types. */
export const VALID_EMPLOYMENT_TYPES = [
  "full_time",
  "part_time",
  "contract",
  "internship",
] as const;

export type EmploymentType = (typeof VALID_EMPLOYMENT_TYPES)[number];

/** Validation failure → HTTP 400. */
export class JobApplicationValidationError extends Error {}

/** Scoped row missing → HTTP 404. */
export class JobApplicationNotFoundError extends Error {}

/**
 * JobApplicationService — server-side Job Application operations.
 *
 * Responsibilities:
 *  - validate input
 *  - enforce ProfessionalIdentity ownership
 *  - CRUD operations via repository
 *  - status validation
 */
export class JobApplicationService {
  private toJobApplicationData(record: JobApplicationRecord): JobApplicationData {
    return {
      applicationId: record.applicationId,
      title: record.title,
      companyName: record.companyName,
      jobDescription: record.jobDescription,
      status: record.status,
      resumeId: record.resumeId,
      matchScore: record.matchScore,
      matchData: record.matchData,
      qualificationMatch: (record as any).qualificationMatch ?? null,
      matchedResumeId: (record as any).matchedResumeId ?? null,
      matchedAt: (record as any).matchedAt?.toISOString() ?? null,
      exportedResumeId: (record as any).exportedResumeId ?? null,
      exportedAt: (record as any).exportedAt?.toISOString() ?? null,
      jobUrl: record.jobUrl,
      location: record.location,
      employmentType: record.employmentType,
      appliedDate: record.appliedDate?.toISOString() ?? null,
      followUpDate: record.followUpDate?.toISOString() ?? null,
      notes: record.notes,
      createdAt: record.createdAt.toISOString(),
      updatedAt: record.updatedAt.toISOString(),
    };
  }

  private validateStatus(status: string): ApplicationStatus {
    if (!VALID_STATUSES.includes(status as ApplicationStatus)) {
      throw new JobApplicationValidationError(
        `Invalid status: ${status}. Must be one of: ${VALID_STATUSES.join(", ")}`,
      );
    }
    return status as ApplicationStatus;
  }

  private validateEmploymentType(employmentType: string): EmploymentType {
    if (!VALID_EMPLOYMENT_TYPES.includes(employmentType as EmploymentType)) {
      throw new JobApplicationValidationError(
        `Invalid employment type: ${employmentType}. Must be one of: ${VALID_EMPLOYMENT_TYPES.join(", ")}`,
      );
    }
    return employmentType as EmploymentType;
  }

  private validateJobUrl(jobUrl: string | null | undefined): string | null {
    if (!jobUrl) return null;
    const trimmed = jobUrl.trim();
    if (!trimmed) return null;
    
    // Must be a valid HTTP/HTTPS URL
    try {
      const url = new URL(trimmed);
      if (url.protocol !== "http:" && url.protocol !== "https:") {
        throw new JobApplicationValidationError(
          "Invalid job URL: only HTTP and HTTPS URLs are allowed."
        );
      }
      return trimmed;
    } catch (err) {
      if (err instanceof JobApplicationValidationError) throw err;
      throw new JobApplicationValidationError(
        "Invalid job URL: please provide a valid URL."
      );
    }
  }

  private parseDate(dateString: string | null | undefined): Date | null {
    if (!dateString) return null;
    const trimmed = dateString.trim();
    if (!trimmed) return null;
    
    const date = new Date(trimmed);
    if (isNaN(date.getTime())) {
      throw new JobApplicationValidationError(
        `Invalid date: ${dateString}`
      );
    }
    return date;
  }

  /** List all applications for an identity. */
  async list(professionalIdentityId: string): Promise<JobApplicationData[]> {
    const records = await jobApplicationRepository.findAllByProfessionalIdentity(
      professionalIdentityId,
    );
    return records.map((r) => this.toJobApplicationData(r));
  }

  /** Get one application, scoped to its owner identity. */
  async get(
    professionalIdentityId: string,
    applicationId: string,
  ): Promise<JobApplicationData> {
    const record = await jobApplicationRepository.findByApplicationIdAndIdentity(
      applicationId,
      professionalIdentityId,
    );
    if (!record) {
      throw new JobApplicationNotFoundError();
    }
    return this.toJobApplicationData(record);
  }

  /** Validate that a resumeId belongs to the given ProfessionalIdentity. */
  private async validateResumeOwnership(
    professionalIdentityId: string,
    resumeId: string | null | undefined,
  ): Promise<void> {
    if (!resumeId) return; // null/undefined is allowed (no resume linked)

    const resume = await prisma.resume.findFirst({
      where: {
        resumeId,
        professionalIdentityId,
      },
    });

    if (!resume) {
      throw new JobApplicationValidationError(
        "The selected resume does not belong to your account.",
      );
    }
  }

  /** Create a new job application. */
  async create(
    professionalIdentityId: string,
    input: CreateJobApplicationInput,
  ): Promise<JobApplicationData> {
    if (!input.title?.trim()) {
      throw new JobApplicationValidationError("Title is required");
    }
    if (!input.companyName?.trim()) {
      throw new JobApplicationValidationError("Company name is required");
    }
    if (!input.jobDescription?.trim()) {
      throw new JobApplicationValidationError("Job description is required");
    }

    // Validate resume ownership before creating
    await this.validateResumeOwnership(professionalIdentityId, input.resumeId);

    // Validate optional fields
    const jobUrl = this.validateJobUrl(input.jobUrl);
    const employmentType = input.employmentType
      ? this.validateEmploymentType(input.employmentType)
      : null;
    const appliedDate = this.parseDate(input.appliedDate);
    const followUpDate = this.parseDate(input.followUpDate);

    const applicationId = `app_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    const id = `approw_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;

    const record = await jobApplicationRepository.create({
      id,
      applicationId,
      professionalIdentityId,
      title: input.title.trim(),
      companyName: input.companyName.trim(),
      jobDescription: input.jobDescription.trim(),
      resumeId: input.resumeId ?? null,
      jobUrl,
      location: input.location?.trim() || null,
      employmentType,
      appliedDate,
      followUpDate,
      notes: input.notes || null,
    });

    return this.toJobApplicationData(record);
  }

  /** Update an existing job application. */
  async update(
    professionalIdentityId: string,
    applicationId: string,
    input: UpdateJobApplicationInput,
  ): Promise<JobApplicationData> {
    const data: Record<string, unknown> = {};

    if (input.title !== undefined) {
      if (!input.title.trim()) {
        throw new JobApplicationValidationError("Title cannot be empty");
      }
      data.title = input.title.trim();
    }
    if (input.companyName !== undefined) {
      if (!input.companyName.trim()) {
        throw new JobApplicationValidationError("Company name cannot be empty");
      }
      data.companyName = input.companyName.trim();
    }
    if (input.jobDescription !== undefined) {
      if (!input.jobDescription.trim()) {
        throw new JobApplicationValidationError("Job description cannot be empty");
      }
      data.jobDescription = input.jobDescription.trim();
    }
    if (input.status !== undefined) {
      data.status = this.validateStatus(input.status);
    }
    if (input.resumeId !== undefined) {
      // Validate resume ownership before updating
      await this.validateResumeOwnership(professionalIdentityId, input.resumeId);
      data.resumeId = input.resumeId;
    }
    if (input.matchScore !== undefined) {
      data.matchScore = input.matchScore;
    }

    // Handle new tracking fields
    if (input.jobUrl !== undefined) {
      data.jobUrl = this.validateJobUrl(input.jobUrl);
    }
    if (input.location !== undefined) {
      data.location = input.location?.trim() || null;
    }
    if (input.employmentType !== undefined) {
      data.employmentType = input.employmentType
        ? this.validateEmploymentType(input.employmentType)
        : null;
    }
    if (input.appliedDate !== undefined) {
      data.appliedDate = this.parseDate(input.appliedDate);
    }
    if (input.followUpDate !== undefined) {
      data.followUpDate = this.parseDate(input.followUpDate);
    }
    if (input.notes !== undefined) {
      data.notes = input.notes || null;
    }

    let record;

    // Update basic fields if any
    if (Object.keys(data).length > 0) {
      record = await jobApplicationRepository.update(
        applicationId,
        professionalIdentityId,
        data as Parameters<typeof jobApplicationRepository.update>[2],
      );
    }

    // Update match data separately (JSON field)
    if (input.matchData !== undefined && input.matchScore !== undefined) {
      record = await jobApplicationRepository.updateMatchData(
        applicationId,
        professionalIdentityId,
        input.matchScore ?? 0,
        input.matchData as Record<string, unknown>,
      );
    } else if (input.matchData !== undefined) {
      // Get current matchScore to pair with matchData
      const current = record || await jobApplicationRepository.findByApplicationIdAndIdentity(
        applicationId,
        professionalIdentityId,
      );
      if (current && input.matchData) {
        record = await jobApplicationRepository.updateMatchData(
          applicationId,
          professionalIdentityId,
          current.matchScore ?? 0,
          input.matchData as Record<string, unknown>,
        );
      }
    }

    // Update full structured QualificationMatch (M3) + match-version metadata
    if (input.qualificationMatch !== undefined && input.qualificationMatch !== null) {
      record = await jobApplicationRepository.updateQualificationMatch(
        applicationId,
        professionalIdentityId,
        input.qualificationMatch as Record<string, unknown>,
        input.matchScore ?? record?.matchScore ?? 0,
        input.matchedResumeId ?? null,
      );
    } else if (input.matchedResumeId !== undefined) {
      // Allow updating just the matchedResumeId without full qualificationMatch
      const current = record || await jobApplicationRepository.findByApplicationIdAndIdentity(
        applicationId,
        professionalIdentityId,
      );
      if (current) {
        record = await jobApplicationRepository.updateQualificationMatch(
          applicationId,
          professionalIdentityId,
          (current as any).qualificationMatch ?? {},
          current.matchScore ?? 0,
          input.matchedResumeId,
        );
      }
    }

    // Handle exportedResumeId — mark resume as exported with server timestamp
    if (input.exportedResumeId !== undefined && input.exportedResumeId !== null) {
      await this.validateResumeOwnership(professionalIdentityId, input.exportedResumeId);
      record = await jobApplicationRepository.markResumeExported(
        applicationId,
        professionalIdentityId,
        input.exportedResumeId,
      );
    }

    if (!record) {
      // If no updates were made, fetch the current record
      record = await jobApplicationRepository.findByApplicationIdAndIdentity(
        applicationId,
        professionalIdentityId,
      );
    }

    if (!record) {
      throw new JobApplicationNotFoundError();
    }

    return this.toJobApplicationData(record);
  }

  /** Mark a resume as successfully exported for this application. */
  async markResumeExported(
    professionalIdentityId: string,
    applicationId: string,
    exportedResumeId: string,
  ): Promise<JobApplicationData> {
    // Validate the application exists and is owned by this identity
    const existing = await jobApplicationRepository.findByApplicationIdAndIdentity(
      applicationId,
      professionalIdentityId,
    );
    if (!existing) {
      throw new JobApplicationNotFoundError();
    }

    // Validate the resume exists and belongs to this identity
    await this.validateResumeOwnership(professionalIdentityId, exportedResumeId);

    const record = await jobApplicationRepository.markResumeExported(
      applicationId,
      professionalIdentityId,
      exportedResumeId,
    );

    if (!record) {
      throw new JobApplicationNotFoundError();
    }

    return this.toJobApplicationData(record);
  }

  /** Delete a job application. */
  async delete(
    professionalIdentityId: string,
    applicationId: string,
  ): Promise<boolean> {
    const deleted = await jobApplicationRepository.deleteByApplicationIdAndIdentity(
      applicationId,
      professionalIdentityId,
    );
    if (!deleted) {
      throw new JobApplicationNotFoundError();
    }
    return true;
  }
}

export const jobApplicationService = new JobApplicationService();
