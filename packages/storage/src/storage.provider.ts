export interface StorageProvider {
  upload(
    file: Buffer,
    path: string,
    options?: { contentType?: string }
  ): Promise<{ url: string; path: string }>;
  download(path: string): Promise<Buffer>;
  delete(path: string): Promise<void>;
  getSignedUrl(
    path: string,
    options?: { expiresIn?: number }
  ): Promise<string>;
}

export const STORAGE_PROVIDER = Symbol("STORAGE_PROVIDER");
