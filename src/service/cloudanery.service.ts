import { v2 as cloudinary } from 'cloudinary';
import fs from 'fs';
import logger from '../utils/logger';

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});
export const uplaodOnCloudinary = async (localFilePath: string): Promise<string | null> => {
    try {
        if (!localFilePath) return null;

        // Upload the file to Cloudinary with signed upload
        // Upload the file to Cloudinary with signed or unsigned upload (with preset)
        logger.debug(`File is at ${localFilePath}`)
        const response = await cloudinary.uploader.upload(localFilePath, {
            resource_type: "auto",
            upload_preset: process.env.CLOUDINARY_UPLOAD_PRESET, // Make sure this env variable is set
        });
        // Delete the locally saved temporary file after successful upload
        fs.unlinkSync(localFilePath);
        
        logger.info(`File uploaded to Cloudinary: ${response.secure_url}`);
        return response.secure_url;
        
    } catch (error) {
        logger.error('Cloudinary upload error:', error);
        return null;
    }
};