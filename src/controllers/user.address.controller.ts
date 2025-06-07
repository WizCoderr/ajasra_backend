import { type Request, type Response } from 'express';
import { prisma } from '../../prisma';
import { asyncHandler } from '../utils/AsyncHandler';
import { ApiResponse } from '../utils/ApiResponse';
import { ApiError } from '../utils/ApiError';
import { addressSchema } from '../middleware/validation.middleware';
import logger from '../utils/logger';

export const addUserAddress = asyncHandler(async (req: Request, res: Response) => {
    try {
        logger.info('Adding user address');
        const userId = req.params.userId;

        // Validate request body
        const { street, city, state, postalCode, country } = req.body;

        if (!street || !city || !state || !postalCode || !country) {
            logger.error('Missing required address fields');
            throw new ApiError(400, "All address fields are required");
        }

        // Validate address data
        const validatedAddress = addressSchema.parse({
            street,
            city,
            state,
            postalCode,
            country
        });

        logger.info(`Updating address for user: ${userId}`);
        const updatedUser = await prisma.user.update({
            where: {
                id: userId
            },
            data: {
                address: validatedAddress
            }
        });

        logger.info('Address updated successfully');
        return res.status(200).json(
            new ApiResponse(200, updatedUser, "Address added successfully")
        );

    } catch (error) {
        logger.error('Error in addUserAddress:', {
            error: error instanceof Error ? error.message : 'Unknown error',
            userId: req.params.userId
        });

        if (error instanceof ApiError) {
            return res.status(error.statusCode).json(error);
        }

        return res.status(500).json(
            new ApiError(500, "Error adding address")
        );
    }
});