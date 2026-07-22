import { Inject, Injectable } from "@nestjs/common";
import type {
  StorageProvider,
  FileMetadata,
  UploadOptions,
} from "@patorbit/storage";
import { STORAGE_PROVIDER } from "./storage.constants";

@Injectable()
export class StorageService {
  constructor(
    @Inject(STORAGE_PROVIDER)
    private readonly provider: StorageProvider
  ) {}

  get providerName(): string {
    return this.provider.name;
  }

  async upload(
    path: string,
    file: Buffer | Blob,
    options?: UploadOptions
  ): Promise<FileMetadata> {
    return this.provider.upload(path, file, options);
  }

  async download(path: string): Promise<Buffer> {
    return this.provider.download(path);
  }

  async delete(path: string): Promise<void> {
    return this.provider.delete(path);
  }

  async getSignedUrl(path: string, expiresIn?: number): Promise<string> {
    return this.provider.getSignedUrl(path, expiresIn);
  }

  async exists(path: string): Promise<boolean> {
    return this.provider.exists(path);
  }
}
