import { v2 as cloudinary } from 'cloudinary';
import logger from '../utils/logger';
import fs from 'fs';

// Configure cloudinary
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

export const uplaodOnCloudinary = async (filePath: string): Promise<string | Error> => {
    try {
        logger.info(`Attempting to upload file: ${filePath}`);
        
        if (!filePath) {
            throw new Error('No file path provided');
        }

        // Upload the image using the upload preset
        const result = await cloudinary.uploader.upload(filePath, {
            upload_preset: process.env.CLOUDINARY_UPLOAD_PRESET,
            resource_type: 'auto'
        });
        fs.unlinkSync(filePath);
        logger.info(`File uploaded successfully to: ${result.secure_url}`);
        return result.secure_url;

    } catch (error) {
        logger.error('Cloudinary upload error:', {
            error: error instanceof Error ? error.message : 'Unknown error',
            filePath
        });
        throw new Error('Failed to upload image to Cloudinary');
    }
};
