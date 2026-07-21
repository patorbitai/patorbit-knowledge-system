// Storage Package
// S3-compatible storage abstraction layer
// Provides interfaces for file upload, download, and management

export interface FileMetadata {
  key: string;
  bucket: string;
  mimeType: string;
  size: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface UploadOptions {
  mimeType?: string;
  metadata?: Record<string, string>;
}

export interface StorageProvider {
  name: string;
  upload(path: string, file: Buffer | Blob, options?: UploadOptions): Promise<FileMetadata>;
  download(path: string): Promise<Buffer>;
  delete(path: string): Promise<void>;
  getSignedUrl(path: string, expiresIn?: number): Promise<string>;
  exists(path: string): Promise<boolean>;
}
