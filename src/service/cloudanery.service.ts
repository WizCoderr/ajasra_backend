import { v2 as cloudinary } from 'cloudinary';
import fs from 'fs';
import path from 'path';
import logger from '../utils/logger';

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

export const uplaodOnCloudinary = async (filePath: string): Promise<string> => {
    try {
        const absolutePath = path.resolve(filePath);

        if (!fs.existsSync(absolutePath)) {
            logger.error("File does not exist", { filePath: absolutePath });
            throw new Error("File not found");
        }

        const result = await cloudinary.uploader.upload(absolutePath);

        fs.unlinkSync(absolutePath);
        logger.info(`File uploaded to Cloudinary: ${result.secure_url}`);
        return result.secure_url;
    } catch (error: any) {
        logger.error('Cloudinary upload error:', {
            error: error.message || error,
            filePath,
        });
        throw new Error('Failed to upload image to Cloudinary');
    }
};
