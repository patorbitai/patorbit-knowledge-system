"use strict";

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
  createdAt: string;
  updatedAt: string;
}

/** Input for creating a job application. */
export interface CreateJobApplicationInput {
  title: string;
  companyName: string;
  jobDescription: string;
  resumeId?: string | null;
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
      data.resumeId = input.resumeId;
    }
    if (input.matchScore !== undefined) {
      data.matchScore = input.matchScore;
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
