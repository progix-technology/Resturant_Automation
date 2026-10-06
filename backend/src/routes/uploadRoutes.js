import express from 'express';
import multer from 'multer';
import { uploadMenuImage, uploadRestaurantImage, deleteMenuImage } from '../services/cloudinaryService.js';

const router = express.Router();

// Configure multer with in-memory storage (up to 15MB upload)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 15 * 1024 * 1024, // 15MB max file size
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files (JPG, PNG, WebP, etc.) are allowed!'), false);
    }
  },
});

/**
 * POST /api/upload/dish-image
 * Receives an image and uploads to Cloudinary with automatic WebP/AVIF compression
 */
router.post('/dish-image', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No image file uploaded. Please attach an image with field name "image".',
      });
    }

    const originalSizeKb = Math.round(req.file.size / 1024);
    const result = await uploadMenuImage(req.file.buffer, req.file.originalname);

    res.status(200).json({
      success: true,
      url: result.url,
      publicId: result.publicId,
      sizeKb: result.sizeKb,
      originalSizeKb,
      format: result.format,
      message: 'Menu image uploaded and optimized via Cloudinary successfully!',
    });
  } catch (error) {
    console.error('Cloudinary Upload Error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to upload image to Cloudinary',
    });
  }
});

/**
 * POST /api/upload/restaurant-image
 * Uploads restaurant branding image (logo, banner) to Cloudinary
 */
router.post('/restaurant-image', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No image file uploaded. Please attach an image with field name "image".',
      });
    }

    const type = req.query.type || req.body.type || 'branding'; // 'logo' | 'banner'
    const originalSizeKb = Math.round(req.file.size / 1024);
    const result = await uploadRestaurantImage(req.file.buffer, req.file.originalname, type);

    res.status(200).json({
      success: true,
      url: result.url,
      publicId: result.publicId,
      sizeKb: result.sizeKb,
      originalSizeKb,
      format: result.format,
      message: `${type.toUpperCase()} image uploaded and optimized via Cloudinary successfully!`,
    });
  } catch (error) {
    console.error('Cloudinary Restaurant Upload Error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to upload restaurant image to Cloudinary',
    });
  }
});


/**
 * DELETE /api/upload/dish-image
 * Removes an image from Cloudinary
 */
router.delete('/dish-image', async (req, res) => {
  try {
    const { publicId, url } = req.body;
    const target = publicId || url;

    if (!target) {
      return res.status(400).json({
        success: false,
        message: 'Image publicId or url is required for deletion',
      });
    }

    const deleted = await deleteMenuImage(target);
    res.status(200).json({
      success: deleted,
      message: deleted ? 'Image removed from Cloudinary' : 'Failed or image not found',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error deleting image from Cloudinary',
    });
  }
});

export default router;
