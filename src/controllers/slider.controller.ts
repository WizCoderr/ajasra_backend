import { prisma } from '../../prisma';
import { type Request, type Response } from 'express';
import { ApiError } from '../utils/ApiError';
import { ApiResponse } from '../utils/ApiResponse';
import { asyncHandler } from '../utils/AsyncHandler';
import { uplaodOnCloudinary } from '../service/cloudanery.service';
import logger from '../utils/logger';

interface MulterRequest extends Request {
    files?:
        | Express.Multer.File[]
        | { [fieldname: string]: Express.Multer.File[] }
        | any;
}

export const addSlider = asyncHandler(
    async (req: MulterRequest, res: Response) => {
        const { title, subtitle } = req.body;
        const image = req.file;

        logger.info(
            `Slider with title: ${title} subtitle: ${subtitle} is uploading`
        );
        if (!title || !subtitle) {
            throw new ApiError(400, 'Title and subTitle are required');
        }

        if (!image) {
            throw new ApiError(400, 'Image file is required');
        }

        // Upload to Cloudinary
        const uploadResult = await uplaodOnCloudinary(image.path);

        if (!uploadResult) {
            throw new ApiError(500, 'Image upload failed');
        }

        const slider = await prisma.slider.create({
            data: {
                title,
                subtitle,
                image: uploadResult,
            },
        });

        return res
            .status(201)
            .json(new ApiResponse(201, slider, 'Slider created successfully'));
    }
);

export const deleteSlider = asyncHandler(
    async (req: Request, res: Response) => {
        const { sliderId } = req.params;
        logger.info('Deleting Slider');
        if (!sliderId) {
            throw new ApiError(400, 'Id is requird');
        }
        await prisma.slider.delete({
            where: { id: sliderId },
        });

        res.status(200).json(
            new ApiResponse(200, 'Slider Deleted Sucessfully')
        );
    }
);

export const getAllSliders = asyncHandler(
    async (req: Request, res: Response) => {
        const sliders = await prisma.slider.findMany();

        res.status(200).json(
            new ApiResponse(200, sliders, 'All Sliders are here')
        );
    }
);
