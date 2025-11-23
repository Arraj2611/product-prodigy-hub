import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import fs from 'fs/promises';
import path from 'path';
import { config } from '../config/index.js';
import logger from '../utils/logger.js';
import { AppError } from '../middleware/errorHandler.js';

// For Cloudflare R2 (S3-compatible)
const getS3Client = () => {
  if (config.STORAGE_TYPE === 'r2') {
    return new S3Client({
      region: 'auto',
      endpoint: `https://${config.CLOUDFLARE_R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: config.CLOUDFLARE_R2_ACCESS_KEY_ID || '',
        secretAccessKey: config.CLOUDFLARE_R2_SECRET_ACCESS_KEY || '',
      },
    });
  } else {
    // AWS S3
    return new S3Client({
      region: config.AWS_REGION || 'us-east-1',
      credentials: {
        accessKeyId: config.AWS_ACCESS_KEY_ID || '',
        secretAccessKey: config.AWS_SECRET_ACCESS_KEY || '',
      },
    });
  }
};

const getBucketName = (): string => {
  if (config.STORAGE_TYPE === 'r2') {
    return config.CLOUDFLARE_R2_BUCKET_NAME || '';
  }
  return config.AWS_S3_BUCKET || '';
};

export interface UploadOptions {
  key: string;
  contentType: string;
  metadata?: Record<string, string>;
}

export const uploadFile = async (
  buffer: Buffer,
  options: UploadOptions
): Promise<string> => {
  try {
    // Local file storage for development
    if (config.STORAGE_TYPE === 'local') {
      const storagePath = path.resolve(config.STORAGE_LOCAL_PATH || './uploads');
      const filePath = path.join(storagePath, options.key);
      const dirPath = path.dirname(filePath);

      // Ensure directory exists
      await fs.mkdir(dirPath, { recursive: true });

      // Write file
      await fs.writeFile(filePath, buffer);

      // Return local URL (will be served by Express static middleware)
      // Use full URL for external access
      const baseUrl = process.env.API_BASE_URL || 'http://localhost:3000';
      return `${baseUrl}/uploads/${options.key}`;
    }

    // Cloud storage (S3/R2)
    const s3Client = getS3Client();
    const bucketName = getBucketName();

    if (!bucketName) {
      throw new AppError('Storage bucket not configured', 500);
    }

    const command = new PutObjectCommand({
      Bucket: bucketName,
      Key: options.key,
      Body: buffer,
      ContentType: options.contentType,
      Metadata: options.metadata,
    });

    await s3Client.send(command);

    // Return the public URL or key
    if (config.STORAGE_TYPE === 'r2') {
      // R2 public URL format
      return `https://pub-${config.CLOUDFLARE_R2_ACCOUNT_ID}.r2.dev/${options.key}`;
    } else {
      // S3 public URL format
      return `https://${bucketName}.s3.${config.AWS_REGION}.amazonaws.com/${options.key}`;
    }
  } catch (error) {
    logger.error('File upload error:', error);
    throw new AppError('Failed to upload file', 500);
  }
};

export const getFileUrl = async (key: string, expiresIn: number = 3600): Promise<string> => {
  try {
    // Local file storage
    if (config.STORAGE_TYPE === 'local') {
      return `/uploads/${key}`;
    }

    // Cloud storage (S3/R2)
    const s3Client = getS3Client();
    const bucketName = getBucketName();

    const command = new GetObjectCommand({
      Bucket: bucketName,
      Key: key,
    });

    return await getSignedUrl(s3Client, command, { expiresIn });
  } catch (error) {
    logger.error('Get file URL error:', error);
    throw new AppError('Failed to get file URL', 500);
  }
};

export const deleteFile = async (key: string): Promise<void> => {
  try {
    // Local file storage
    if (config.STORAGE_TYPE === 'local') {
      const storagePath = path.resolve(config.STORAGE_LOCAL_PATH || './uploads');
      const filePath = path.join(storagePath, key);
      await fs.unlink(filePath).catch(() => {
        // File might not exist, ignore error
      });
      return;
    }

    // Cloud storage (S3/R2)
    const s3Client = getS3Client();
    const bucketName = getBucketName();

    const command = new DeleteObjectCommand({
      Bucket: bucketName,
      Key: key,
    });

    await s3Client.send(command);
  } catch (error) {
    logger.error('File deletion error:', error);
    throw new AppError('Failed to delete file', 500);
  }
};

