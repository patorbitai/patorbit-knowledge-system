"use strict";

import fs from "fs/promises";
import path from "path";

const STORAGE_DIR = process.env.STORAGE_DIR || path.join(process.cwd(), "uploads", "evidence");

export interface EvidenceStorageService {
  uploadFile(buffer: Buffer, filename: string, mimeType: string): Promise<string>;
  getFile(storageKey: string): Promise<Buffer | null>;
  deleteFile(storageKey: string): Promise<void>;
}

class LocalEvidenceStorageAdapter implements EvidenceStorageService {
  async ensureDir() {
    try {
      await fs.mkdir(/*turbopackIgnore: true*/ STORAGE_DIR, { recursive: true });
    } catch {}
  }

  async uploadFile(buffer: Buffer, filename: string, mimeType: string): Promise<string> {
    await this.ensureDir();
    const uniqueSuffix = `${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    const sanitizedName = (filename || "file").replace(/[^a-zA-Z0-9_.-]/g, "_");
    const storageKey = `evd_${uniqueSuffix}_${sanitizedName}`;
    const filePath = path.join(/*turbopackIgnore: true*/ STORAGE_DIR, path.basename(storageKey));
    await fs.writeFile(filePath, buffer);
    return storageKey;
  }

  async getFile(storageKey: string): Promise<Buffer | null> {
    if (!storageKey) return null;
    try {
      const filePath = path.join(/*turbopackIgnore: true*/ STORAGE_DIR, path.basename(storageKey));
      return await fs.readFile(/*turbopackIgnore: true*/ filePath);
    } catch {
      return null;
    }
  }

  async deleteFile(storageKey: string): Promise<void> {
    if (!storageKey) return;
    try {
      const filePath = path.join(/*turbopackIgnore: true*/ STORAGE_DIR, path.basename(storageKey));
      await fs.unlink(/*turbopackIgnore: true*/ filePath);
    } catch {}
  }
}

export const evidenceStorageService: EvidenceStorageService = new LocalEvidenceStorageAdapter();
