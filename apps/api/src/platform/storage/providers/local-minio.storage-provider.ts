import { Injectable, Logger, type OnModuleInit } from "@nestjs/common";
import { type ConfigService } from "@nestjs/config";
import  { type FileMetadata, type StorageProvider, type UploadOptions } from "@patorbit/storage";
import * as Minio from "minio";

@Injectable()
export class LocalMinioStorageProvider implements StorageProvider, OnModuleInit {
  private readonly logger = new Logger(LocalMinioStorageProvider.name);
  readonly name = "minio";

  private client: Minio.Client;
  private bucket: string;

  constructor(private readonly configService: ConfigService) {
    const endpoint = this.configService.get<string>("STORAGE_ENDPOINT", "http://localhost:9000");
    const region = this.configService.get<string>("STORAGE_REGION", "us-east-1");
    const accessKey = this.configService.get<string>("STORAGE_ACCESS_KEY", "minioadmin");
    const secretKey = this.configService.get<string>("STORAGE_SECRET_KEY", "minioadmin");

    // Parse endpoint to extract host and port
    const url = new URL(endpoint);

    this.bucket = this.configService.get<string>("STORAGE_BUCKET", "patorbit");

    this.client = new Minio.Client({
      endPoint: url.hostname,
      port: url.port ? Number(url.port) : 9000,
      useSSL: url.protocol === "https:",
      accessKey,
      secretKey,
      region,
    });
  }

  async onModuleInit(): Promise<void> {
    try {
      const exists = await this.client.bucketExists(this.bucket);
      if (!exists) {
        await this.client.makeBucket(this.bucket, "");
        this.logger.log(`Created bucket "${this.bucket}"`);
      }
      this.logger.log(`Connected to MinIO at ${this.configService.get<string>("STORAGE_ENDPOINT")}`);
    } catch (error) {
      this.logger.error(`Failed to initialize MinIO bucket: ${(error as Error).message}`);
    }
  }

  async upload(
    filePath: string,
    file: Buffer | Blob,
    options?: UploadOptions
  ): Promise<FileMetadata> {
    const buffer = file instanceof Buffer ? file : Buffer.from(await file.arrayBuffer());
    const metaData: Record<string, string> = {
      "Content-Type": options?.mimeType ?? "application/octet-stream",
      ...options?.metadata,
    };

    await this.client.putObject(this.bucket, filePath, buffer, buffer.length, metaData);

    const stat = await this.client.statObject(this.bucket, filePath);

    this.logger.log(`Uploaded ${filePath} to MinIO bucket "${this.bucket}"`);

    return {
      key: filePath,
      bucket: this.bucket,
      mimeType: options?.mimeType ?? "application/octet-stream",
      size: stat.size,
      createdAt: stat.lastModified,
      updatedAt: stat.lastModified,
    };
  }

  async download(filePath: string): Promise<Buffer> {
    const stream = await this.client.getObject(this.bucket, filePath);
    const chunks: Buffer[] = [];
    for await (const chunk of stream) {
      chunks.push(chunk instanceof Buffer ? chunk : Buffer.from(chunk));
    }
    const buffer = Buffer.concat(chunks);
    this.logger.log(`Downloaded ${filePath} from MinIO (${buffer.length} bytes)`);
    return buffer;
  }

  async delete(filePath: string): Promise<void> {
    await this.client.removeObject(this.bucket, filePath);
    this.logger.log(`Deleted ${filePath} from MinIO`);
  }

  async getSignedUrl(filePath: string, expiresIn = 3600): Promise<string> {
    const url = await this.client.presignedGetObject(this.bucket, filePath, expiresIn);
    return url;
  }

  async exists(filePath: string): Promise<boolean> {
    try {
      await this.client.statObject(this.bucket, filePath);
      return true;
    } catch {
      return false;
    }
  }
}
