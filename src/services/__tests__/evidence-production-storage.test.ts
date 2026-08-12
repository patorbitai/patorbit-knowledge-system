"use strict";

import { describe, it, expect, beforeEach, vi } from "vitest";
import { evidenceStorageService } from "../evidence-storage.service";

const { findUniqueMock, createMock, deleteMock, findManyMock } = vi.hoisted(() => ({
  findUniqueMock: vi.fn(),
  createMock: vi.fn(),
  deleteMock: vi.fn(),
  findManyMock: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    evidenceRecord: {
      findUnique: findUniqueMock,
      create: createMock,
      delete: deleteMock,
      findMany: findManyMock,
    },
  },
}));

import { evidenceRepository } from "@/repositories/evidence.repository";

describe("EPIC-07 Production Evidence Storage & Access Control", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("supports upload, storage retrieval, and deletion in storage abstraction", async () => {
    const testBuffer = Buffer.from("test pdf content");
    const filename = "resume-cert.pdf";
    const mimeType = "application/pdf";

    const storageKey = await evidenceStorageService.uploadFile(testBuffer, filename, mimeType);
    expect(storageKey).toBeDefined();

    const retrievedBuffer = await evidenceStorageService.getFile(storageKey);
    expect(retrievedBuffer).toEqual(testBuffer);

    await evidenceStorageService.deleteFile(storageKey);
    const deletedBuffer = await evidenceStorageService.getFile(storageKey);
    expect(deletedBuffer).toBeNull();
  });

  it("handles storage failure gracefully when retrieving non-existent file", async () => {
    const res = await evidenceStorageService.getFile("non_existent_key_12345");
    expect(res).toBeNull();
  });

  it("preserves evidence-to-claim relationship and metadata semantics via repository", async () => {
    const evidenceId = "evd_test_1";
    const userId = "usr_test_1";
    const claimId = "claim_test_1";

    const mockRecord = {
      id: evidenceId,
      userId,
      claimId,
      evidenceType: "file",
      evidenceKind: "Certificate",
      content: "storage_key_abc",
      format: "application/pdf",
      metadata: JSON.stringify({ fileName: "cert.pdf", fileSize: 1024 }),
      status: "evidence-added",
      confidence: 0.9,
      notes: "Valid cert",
      visibility: "private",
      consent: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    createMock.mockResolvedValue(mockRecord);
    findUniqueMock.mockResolvedValue(mockRecord);

    const record = await evidenceRepository.create({
      id: evidenceId,
      userId,
      claimId,
      evidenceType: "file",
      evidenceKind: "Certificate",
      content: "storage_key_abc",
      format: "application/pdf",
      metadata: JSON.stringify({ fileName: "cert.pdf", fileSize: 1024 }),
      status: "evidence-added",
      confidence: 0.9,
      notes: "Valid cert",
      visibility: "private",
      consent: true,
    });

    expect(record.claimId).toBe(claimId);
    expect(record.userId).toBe(userId);
    expect(record.evidenceType).toBe("file");
    expect(record.visibility).toBe("private");

    const fetched = await evidenceRepository.findById(evidenceId);
    expect(fetched).not.toBeNull();
    expect(fetched?.claimId).toBe(claimId);
  });
});
