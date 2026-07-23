import { Injectable, Logger } from '@nestjs/common';
import { extname } from 'path';
import { v4 as uuid } from 'uuid';

export interface UploadedFileInfo {
  key: string;
  originalName: string;
  mimeType: string;
  size: number;
  url: string;
}

export interface ImageOptimizationOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  format?: 'jpeg' | 'png' | 'webp';
}

const ALLOWED_MIME_TYPES: Record<string, string[]> = {
  image: ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'],
  document: [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  ],
  video: ['video/mp4', 'video/webm', 'video/ogg'],
  archive: ['application/zip', 'application/x-tar', 'application/gzip'],
};

const MAX_FILE_SIZES: Record<string, number> = {
  image: 10 * 1024 * 1024, // 10 MB
  document: 25 * 1024 * 1024, // 25 MB
  video: 100 * 1024 * 1024, // 100 MB
  archive: 50 * 1024 * 1024, // 50 MB
  default: 5 * 1024 * 1024, // 5 MB
};

@Injectable()
export class UploadService {
  private readonly logger = new Logger(UploadService.name);

  async validateFile(
    file: Express.Multer.File,
    allowedCategories?: Array<'image' | 'document' | 'video' | 'archive'>,
  ): Promise<void> {
    const categories = allowedCategories ?? ['image', 'document'];

    const matchedCategory = categories.find((cat) =>
      ALLOWED_MIME_TYPES[cat].includes(file.mimetype),
    );

    if (!matchedCategory) {
      throw new Error(
        `File type ${file.mimetype} is not allowed. Allowed: ${categories.join(', ')}`,
      );
    }

    const maxSize = MAX_FILE_SIZES[matchedCategory] ?? MAX_FILE_SIZES.default;
    if (file.size > maxSize) {
      throw new Error(
        `File size ${(file.size / 1024 / 1024).toFixed(1)}MB exceeds the ${(maxSize / 1024 / 1024).toFixed(0)}MB limit for ${matchedCategory} files.`,
      );
    }
  }

  async sanitizeFilename(originalName: string): Promise<string> {
    const ext = extname(originalName).toLowerCase();
    const safeName = uuid();
    return `${safeName}${ext}`;
  }

  async detectVirus(file: Buffer): Promise<boolean> {
    // ClamAV integration hook — passes through when no scanner is configured
    if (!process.env.CLAMAV_HOST) {
      return true;
    }

    try {
      const NodeClam = (await import('clamscan')).default;
      const clamscan = await NodeClam.init({
        clamdscan: { host: process.env.CLAMAV_HOST, port: Number(process.env.CLAMAV_PORT) ?? 3310 },
      });
      const { isInfected } = await clamscan.scanBuffer(file);
      return !isInfected;
    } catch (error) {
      this.logger.warn(`Virus scan unavailable: ${(error as Error).message}`);
      return true;
    }
  }

  async optimizeImage(buffer: Buffer, options?: ImageOptimizationOptions): Promise<Buffer> {
    try {
      const sharp = (await import('sharp')).default;
      let pipeline = sharp(buffer);

      if (options?.maxWidth || options?.maxHeight) {
        pipeline = pipeline.resize(options.maxWidth, options.maxHeight, {
          fit: 'inside',
          withoutEnlargement: true,
        });
      }

      const format = options?.format ?? 'jpeg';
      if (format === 'jpeg') pipeline = pipeline.jpeg({ quality: options?.quality ?? 85 });
      else if (format === 'png') pipeline = pipeline.png({ quality: options?.quality ?? 85 });
      else if (format === 'webp') pipeline = pipeline.webp({ quality: options?.quality ?? 80 });

      return await pipeline.toBuffer();
    } catch (error) {
      this.logger.warn(
        `Image optimization unavailable, returning original: ${(error as Error).message}`,
      );
      return buffer;
    }
  }
}
