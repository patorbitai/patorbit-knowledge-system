import * as fs from "node:fs/promises";
import * as path from "node:path";

import { Injectable, Logger } from "@nestjs/common";
import  { type FileMetadata, type StorageProvider, type UploadOptions } from "@patorbit/storage";

@Injectable()
export class DiskStorageProvider implements StorageProvider {
  private readonly logger = new Logger(DiskStorageProvider.name);
  readonly name = "disk";

  private baseDir: string;

  constructor(baseDir?: string) {
    this.baseDir = baseDir ?? path.resolve(process.cwd(), ".data", "storage");
  }

  async upload(
    filePath: string,
    file: Buffer | Blob,
    options?: UploadOptions
  ): Promise<FileMetadata> {
    const fullPath = path.join(this.baseDir, filePath);
    await fs.mkdir(path.dirname(fullPath), { recursive: true });

    const buffer = file instanceof Buffer ? file : Buffer.from(await file.arrayBuffer());
    await fs.writeFile(fullPath, buffer);

    const stat = await fs.stat(fullPath);
    const now = new Date();

    this.logger.log(`Uploaded ${filePath} (${stat.size} bytes)`);

    return {
      key: filePath,
      bucket: this.baseDir,
      mimeType: options?.mimeType ?? "application/octet-stream",
      size: stat.size,
      createdAt: now,
      updatedAt: now,
    };
  }

  async download(filePath: string): Promise<Buffer> {
    const fullPath = path.join(this.baseDir, filePath);
    const buffer = await fs.readFile(fullPath);
    this.logger.log(`Downloaded ${filePath} (${buffer.length} bytes)`);
    return buffer;
  }

  async delete(filePath: string): Promise<void> {
    const fullPath = path.join(this.baseDir, filePath);
    await fs.unlink(fullPath);
    this.logger.log(`Deleted ${filePath}`);
  }

  async getSignedUrl(filePath: string, _expiresIn?: number): Promise<string> {
    // Disk provider: return a local file URL (no real signed URL)
    const fullPath = path.join(this.baseDir, filePath);
    return `file://${fullPath}`;
  }

  async exists(filePath: string): Promise<boolean> {
    const fullPath = path.join(this.baseDir, filePath);
    try {
      await fs.access(fullPath);
      return true;
    } catch {
      return false;
    }
  }
}
