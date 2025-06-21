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

            const userId = req.user?.id;
            if (!userId) {
                return res
                    .status(400)
                    .json(new ApiError(400, 'User ID is required'));
            }

            logger.warn(
                `Product with ProductId: ${productId} is going to be added to user: ${userId}`
            );

            // Check if product exists
            const productExists = await prisma.product.findUnique({
                where: { id: productId },
            });

            if (!productExists) {
                return res
                    .status(404)
                    .json(new ApiError(404, 'Product not found'));
            }

            // Check if the product is already in wishlist
            const existingWishlistItem = await prisma.userWishlist.findUnique({
                where: {
                    userId_productId: {
                        userId,
                        productId,
                    },
                },
            });

            if (existingWishlistItem) {
                return res
                    .status(200)
                    .json(
                        new ApiResponse(
                            200,
                            existingWishlistItem,
                            'Product already in wishlist'
                        )
                    );
            }

            // Create wishlist item
            await prisma.userWishlist.create({
                data: {
                    userId,
                    productId,
                },
            });

            // Fetch with relations
            const wishlistItem = await prisma.userWishlist.findUnique({
                where: {
                    userId_productId: {
                        userId,
                        productId,
                    },
                },
                include: {
                    product: {
                        include: {
                            category: true,
                        },
                    },
                },
            });

            logger.debug('Wishlist Saved');

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
            logger.error('Error adding wishlist item:', error);
            return res
                .status(500)
                .json(new ApiError(500, 'Internal Server Error'));
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
            if (!wishlistItems) {
                return res.json({
                    size: 0,
                });
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
