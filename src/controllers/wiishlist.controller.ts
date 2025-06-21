import { type Request, type Response } from 'express';
import { prisma } from '../../prisma';
import { handleAppError } from '../service/error.service';
import { asyncHandler } from '../utils/AsyncHandler';
import { ApiResponse } from '../utils/ApiResponse';
import { ApiError } from '../utils/ApiError';
import logger from '../utils/logger';

export const addWishlistItem = asyncHandler(
    async (req: Request, res: Response) => {
        try {
            logger.debug("Let's add a product to wishlist");
            const { productId } = req.params;
            if (!productId) {
                return res
                    .status(400)
                    .json(new ApiError(400, 'Product ID is required'));
            }

            const userId = req.params.id;
            if (!userId) {
                return res
                    .status(400)
                    .json(new ApiError(400, 'User ID is required'));
            }

            const wishlistItem = await prisma.userWishlist.create({
                data: {
                    userId: userId,
                    productId: productId,
                },
                include: {
                    product: {
                        include: {
                            category: true,
                        },
                    },
                },
            });

            return res
                .status(201)
                .json(
                    new ApiResponse(
                        201,
                        wishlistItem,
                        'Product added to wishlist'
                    )
                );
        } catch (error) {
            handleAppError(error);
        }
    }
);

export const getWishlistItems = asyncHandler(
    async (req: Request, res: Response) => {
        try {
            logger.debug("Let's get wishlist items");
            const userId = req.user?.id;
            if (!userId) {
                return res
                    .status(400)
                    .json(new ApiError(400, 'User ID is required'));
            }

            const wishlistItems = await prisma.userWishlist.findMany({
                where: { userId: userId },
                include: {
                    product: {
                        include: {
                            category: true,
                        },
                    },
                },
            });
            if(!wishlistItems){
                return res.json({
                    'size': 0
                })
            }
            return res
                .status(200)
                .json(
                    new ApiResponse(
                        200,
                        wishlistItems,
                        'Wishlist items retrieved successfully'
                    )
                );
        } catch (error) {
            handleAppError(error);
        }
    }
);

export const deleteWishlistItem = asyncHandler(
    async (req: Request, res: Response) => {
        try {
            logger.debug("Let's delete a product from wishlist");
            const { productId } = req.params;
            if (!productId) {
                return res
                    .status(400)
                    .json(new ApiError(400, 'Product ID is required'));
            }

            const userId = req.user?.id;
            if (!userId) {
                return res
                    .status(400)
                    .json(new ApiError(400, 'User ID is required'));
            }

            const deletedItem = await prisma.userWishlist.delete({
                where: {
                    userId_productId: {
                        userId: userId,
                        productId: productId,
                    },
                },
            });

            return res
                .status(200)
                .json(
                    new ApiResponse(
                        200,
                        deletedItem,
                        'Product removed from wishlist'
                    )
                );
        } catch (error) {
            handleAppError(error);
        }
    }
);
