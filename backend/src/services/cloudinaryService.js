import { v2 as cloudinary } from 'cloudinary';

// Configure Cloudinary from environment variables
const configureCloudinary = () => {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;

  if (!cloudName || !apiKey || !apiSecret) {
    console.warn('[CLOUDINARY WARNING] Credentials missing in environment variables');
  }

  cloudinary.config({
    cloud_name: cloudName,
    api_key: apiKey,
    api_secret: apiSecret,
    secure: true,
  });
};

/**
 * Uploads an image buffer directly to Cloudinary with automatic optimization (WebP/AVIF, quality auto)
 * @param {Buffer} fileBuffer - Image buffer from multer
 * @param {string} originalName - Original filename
 * @returns {Promise<{ url: string, publicId: string, sizeKb: number, format: string }>}
 */
export const uploadMenuImage = async (fileBuffer, originalName = 'dish') => {
  configureCloudinary();

  const safeBaseName = originalName
    .replace(/\.[^/.]+$/, '')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '-')
    .slice(0, 30);

  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: 'restaurant-menu',
        public_id: `${safeBaseName}-${Date.now()}`,
        resource_type: 'image',
        transformation: [
          { width: 800, height: 800, crop: 'limit' },
          { quality: 'auto', fetch_format: 'auto' }, // Cloudinary automatic compression & WebP format
        ],
      },
      (error, result) => {
        if (error) {
          console.error('[CLOUDINARY UPLOAD ERROR]', error);
          return reject(new Error(error.message || 'Cloudinary upload failed'));
        }

        const sizeKb = Math.round((result.bytes / 1024) * 10) / 10;
        console.log(`[CLOUDINARY UPLOAD] Uploaded ${originalName} -> ${result.public_id} (${sizeKb} KB)`);

        resolve({
          url: result.secure_url,
          publicId: result.public_id,
          sizeKb,
          format: result.format,
        });
      }
    );

    uploadStream.end(fileBuffer);
  });
};

/**
 * Removes an image from Cloudinary using publicId or its secure URL
 * @param {string} publicIdOrUrl
 */
export const deleteMenuImage = async (publicIdOrUrl) => {
  try {
    configureCloudinary();

    let publicId = publicIdOrUrl;
    // Extract public_id if full URL was provided
    if (publicIdOrUrl.includes('res.cloudinary.com')) {
      const parts = publicIdOrUrl.split('/upload/');
      if (parts.length > 1) {
        const pathAfterUpload = parts[1].replace(/^v\d+\//, ''); // remove version prefix e.g. v1234567/
        publicId = pathAfterUpload.substring(0, pathAfterUpload.lastIndexOf('.')) || pathAfterUpload;
      }
    }

    const res = await cloudinary.uploader.destroy(publicId);
    console.log(`[CLOUDINARY DELETE] Result for ${publicId}:`, res.result);
    return res.result === 'ok';
  } catch (err) {
    console.warn(`[CLOUDINARY DELETE WARNING] Failed to delete ${publicIdOrUrl}:`, err.message);
    return false;
  }
};

/**
 * Uploads restaurant branding image (logo, banner) directly to Cloudinary
 * @param {Buffer} fileBuffer
 * @param {string} originalName
 * @param {string} type - 'logo' | 'banner' | 'branding'
 */
export const uploadRestaurantImage = async (fileBuffer, originalName = 'branding', type = 'branding') => {
  configureCloudinary();

  const safeBaseName = originalName
    .replace(/\.[^/.]+$/, '')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '-')
    .slice(0, 30);

  const isLogo = type === 'logo';
  const folder = isLogo ? 'restaurant-branding/logos' : 'restaurant-branding/banners';
  const transformation = isLogo
    ? [
        { width: 500, height: 500, crop: 'limit' },
        { quality: 'auto', fetch_format: 'auto' },
      ]
    : [
        { width: 1600, height: 900, crop: 'limit' },
        { quality: 'auto', fetch_format: 'auto' },
      ];

  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder,
        public_id: `${type}-${safeBaseName}-${Date.now()}`,
        resource_type: 'image',
        transformation,
      },
      (error, result) => {
        if (error) {
          console.error('[CLOUDINARY BRANDING UPLOAD ERROR]', error);
          return reject(new Error(error.message || 'Cloudinary upload failed'));
        }

        const sizeKb = Math.round((result.bytes / 1024) * 10) / 10;
        console.log(`[CLOUDINARY BRANDING] Uploaded ${type} ${originalName} -> ${result.public_id} (${sizeKb} KB)`);

        resolve({
          url: result.secure_url,
          publicId: result.public_id,
          sizeKb,
          format: result.format,
        });
      }
    );

    uploadStream.end(fileBuffer);
  });
};

