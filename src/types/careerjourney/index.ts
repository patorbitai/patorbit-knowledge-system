"use strict";

import { type Claim, type Evidence } from "../resume";

/**
 * Core domain objects for the Career Journey.
 *
 * These types define the structure of the canonical Career Journey,
 * adhering strictly to ADR-006. They are pure data structures with no
 * behavior or AI integration.
 */

/** A single statement within a Career Journey chapter. */
export interface JourneyStatement {
  /** Stable unique identifier for this statement. Immutable after creation. */
  id: string;
  /** The narrative text describing a professional transition or achievement. */
  statement: string;
  /** Confidence that this statement accurately reflects the professional trajectory. */
  confidence: number; // 0-1
  /** The underlying evidence that supports this statement. */
  evidence: Evidence[];
  /** The source claims that gave rise to this statement. */
  claims: Claim[];
}

/** A chapter represents a distinct phase or transition in the professional journey. */
export interface JourneyChapter {
  /** Stable unique identifier for this chapter. Immutable after creation. */
  id: string;
  /** Human-readable title for this chapter. */
  title: string;
  /** Sequential order of the chapter within the journey. */
  sequence: number;
  /** The statements that make up this chapter. */
  statements: JourneyStatement[];
}

/** A Journey is the synthesized, evidence-traceable representation of a professional's evolution. */
export interface CareerJourney {
  /** Unique identifier for this Journey instance. */
  id: string;
  /** Version number for the Journey (incremented on regeneration). */
  version: number;
  /** The timeline of chapters that constitute the Journey. */
  chapters: JourneyChapter[];
  /** Timestamp when this Journey was last regenerated. */
  lastRegeneratedAt: string;
  /** The professional identity this Journey represents. */
  identityId: string;
  /** Lifecycle state of this Journey. */
  status: JourneyStatus;
  /** The single most compelling supported statement, selected by the synthesis engine. */
  strongestProof: JourneyStatement | null;
}

/** Provenance tracking for each Journey version. */
export interface JourneyProvenance {
  /** Unique identifier for the provenance record. */
  id: string;
  /** The Journey this provenance belongs to. */
  journeyId: string;
  /** The source data that contributed to this Journey. */
  sources: JourneySource[];
  /** Timestamp when this provenance was created. */
  createdAt: string;
}

/** A data source that contributed to a Career Journey. */
export interface JourneySource {
  /** The type of data source. */
  type: "resume" | "experience" | "education" | "projects" | "skills" | "certifications" | "github" | "portfolio" | "research" | "community";
  /** Description of the source and its contribution. */
  description: string;
  /** The impact factor of this source on the Journey (0-1). */
  impactFactor: number;
}

/** Status values for Career Journey lifecycle. */
export type JourneyStatus = "draft" | "reviewing" | "approved" | "published";

/** Configuration for Journey lifecycle management. */
export interface JourneyConfig {
  /** Maximum number of chapters allowed in a Journey. */
  maxChapters: number;
  /** Minimum confidence threshold for a Journey statement. */
  minStatementConfidence: number;
  /** Whether the Journey can be regenerated. */
  allowRegeneration: boolean;
}