import { prisma } from '../../prisma';
import { type Request, type Response } from 'express';
import { ApiError } from '../utils/ApiError';
import { ApiResponse } from '../utils/ApiResponse';
import { asyncHandler } from '../utils/AsyncHandler';
import { uplaodOnCloudinary } from '../service/cloudanery.service';
import logger from '../utils/logger';


export const addSlider = asyncHandler(
    async (req: Request, res: Response) => {
        const {image} = req.body;

        logger.info(
            `Slider is uploading`
        );

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
