import multer from 'multer';
import { Request } from 'express';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import sharp from 'sharp';
import { uploadFile, deleteFile } from './storage.service.js';
import prisma from '../config/database.js';
import { AppError } from '../middleware/errorHandler.js';
import logger from '../utils/logger.js';

// Configure multer for memory storage
const storage = multer.memoryStorage();

const fileFilter = (_req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  // Allow images and videos
  const allowedMimes = [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/webp',
    'video/mp4',
    'video/quicktime',
    'video/x-msvideo',
  ];

  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new AppError('Invalid file type. Only images and videos are allowed.', 400));
  }
};

export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB
  },
});

export interface ProcessedAsset {
  url: string;
  storageKey: string;
  type: 'image' | 'video';
  size: number;
  mimeType: string;
  metadata?: Record<string, any>;
}

export const processAndUploadAsset = async (
  file: Express.Multer.File,
  productId: string,
  userId: string
): Promise<ProcessedAsset> => {
  try {
    const fileExtension = path.extname(file.originalname);
    const fileId = uuidv4();
    const isImage = file.mimetype.startsWith('image/');
    // const isVideo = file.mimetype.startsWith('video/'); // Reserved for future video processing

    let processedBuffer: Buffer = file.buffer;
    let finalMimeType = file.mimetype;
    let metadata: Record<string, any> = {};

    // Process images: resize and optimize
    if (isImage) {
      try {
        const image = sharp(file.buffer);
        const imageMetadata = await image.metadata();

        // Extract color and texture information for AI analysis
        metadata = {
          width: imageMetadata.width,
          height: imageMetadata.height,
          format: imageMetadata.format,
          hasAlpha: imageMetadata.hasAlpha,
          // Color analysis (basic - can be enhanced)
          dominantColors: await extractDominantColors(image),
        };

        // Resize if too large (max 2048px on longest side)
        const maxDimension = 2048;
        if (imageMetadata.width && imageMetadata.height) {
          if (imageMetadata.width > maxDimension || imageMetadata.height > maxDimension) {
            processedBuffer = await image
              .resize(maxDimension, maxDimension, {
                fit: 'inside',
                withoutEnlargement: true,
              })
              .jpeg({ quality: 85 })
              .toBuffer();
            finalMimeType = 'image/jpeg';
          } else {
            // Optimize without resizing
            processedBuffer = await image
              .jpeg({ quality: 85 })
              .toBuffer();
            finalMimeType = 'image/jpeg';
          }
        }
      } catch (error) {
        logger.warn('Image processing error, using original:', error);
        // Use original if processing fails
        processedBuffer = file.buffer;
      }
    }

    // Generate storage key
    const storageKey = `products/${productId}/${fileId}${fileExtension}`;

    // Upload to storage
    const url = await uploadFile(processedBuffer, {
      key: storageKey,
      contentType: finalMimeType,
      metadata: {
        originalName: file.originalname,
        uploadedBy: userId,
        productId,
        ...metadata,
      },
    });

    return {
      url,
      storageKey,
      type: isImage ? 'image' : 'video',
      size: processedBuffer.length,
      mimeType: finalMimeType,
      metadata,
    };
  } catch (error) {
    logger.error('Asset processing error:', error);
    throw new AppError('Failed to process and upload asset', 500);
  }
};

// Extract dominant colors from image (simplified version)
const extractDominantColors = async (image: sharp.Sharp): Promise<string[]> => {
  try {
    // Resize to small size for faster processing
    const { data, info } = await image
      .resize(100, 100, { fit: 'cover' })
      .raw()
      .toBuffer({ resolveWithObject: true });

    // Simple color extraction (can be enhanced with k-means clustering)
    const colors = new Set<string>();
    const step = info.channels || 3;

    for (let i = 0; i < data.length; i += step * 10) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      const hex = `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
      colors.add(hex);
      if (colors.size >= 5) break; // Limit to 5 colors
    }

    return Array.from(colors);
  } catch (error) {
    logger.warn('Color extraction error:', error);
    return [];
  }
};

export const saveAssetToDatabase = async (
  productId: string,
  asset: ProcessedAsset
) => {
  return prisma.productAsset.create({
    data: {
      productId,
      type: asset.type,
      url: asset.url,
      storageKey: asset.storageKey,
      size: asset.size,
      mimeType: asset.mimeType,
      metadata: asset.metadata || {},
    },
  });
};

export const deleteAsset = async (assetId: string) => {
  const asset = await prisma.productAsset.findUnique({
    where: { id: assetId },
  });

  if (!asset) {
    throw new AppError('Asset not found', 404);
  }

  // Delete from storage
  try {
    await deleteFile(asset.storageKey);
  } catch (error) {
    logger.warn('Failed to delete file from storage:', error);
  }

  // Delete from database
  await prisma.productAsset.delete({
    where: { id: assetId },
  });
};

