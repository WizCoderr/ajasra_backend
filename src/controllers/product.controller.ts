import { type Request, type Response } from 'express';
import { prisma } from '../../prisma';
import { handleAppError } from '../service/error.service';
import { uplaodOnCloudinary } from '../service/cloudanery.service';
import { createProductSchema } from '../middleware/validation.middleware';
import { asyncHandler } from '../utils/AsyncHandler';
import { ApiResponse } from '../utils/ApiResponse';
import { ApiError } from '../utils/ApiError';
import logger from '../utils/logger';
import { redis } from '../service/redis.service';

interface MulterRequest extends Request {
    files?:
        | Express.Multer.File[]
        | { [fieldname: string]: Express.Multer.File[] }
        | any;
}

export const addProduct = asyncHandler(
    async (req: MulterRequest, res: Response) => {
        try {
            const categoryId = req.params.categoryId;
            logger.info(`Creating product for category: ${categoryId}`);

            // Check if category exists
            const category = await prisma.category.findUnique({
                where: { id: categoryId },
            });

            if (!category) {
                logger.error(`Category not found: ${categoryId}`);
                return res
                    .status(404)
                    .json(new ApiError(404, 'Category not found'));
            }

            // Validate required fields
            const requiredFields = [
                'name',
                'description',
                'price',
                'material',
                'fit',
                'brand',
            ];
            const missingFields = requiredFields.filter(
                (field) => !req.body[field]
            );

            if (missingFields.length > 0) {
                logger.error(
                    `Missing required fields: ${missingFields.join(', ')}`
                );
                return res
                    .status(400)
                    .json(
                        new ApiError(
                            400,
                            `Required fields missing: ${missingFields.join(
                                ', '
                            )}`
                        )
                    );
            }

            // Parse and prepare product data
            const parsedBody = {
                name: req.body.name,
                description: req.body.description,
                price: parseFloat(req.body.price),
                material: req.body.material,
                fit: (req.body.fit || '').toUpperCase(),
                brand: req.body.brand,
                images: [],
                featured:
                    req.body.featured === 'true' || Boolean(req.body.featured),
                sizes: Array.isArray(req.body.sizes)
                    ? req.body.sizes
                    : JSON.parse(req.body.sizes || '[]'),
                colors: Array.isArray(req.body.colors)
                    ? req.body.colors
                    : JSON.parse(req.body.colors || '[]'),
                categoryId,
            };

            // Validate schema
            const validatedData = createProductSchema.parse(parsedBody);

            // Validate fit
            const allowedFits = ['SLIM', 'REGULAR'];
            if (!allowedFits.includes(validatedData.fit)) {
                throw new ApiError(
                    400,
                    'Invalid fit value. Must be SLIM or REGULAR'
                );
            }

            // Upload images if provided
            let uploadedImages: string[] = [];
            if (req.files && req.files.length > 0) {
                const uploadPromises = req.files.map(async (file: any) => {
                    const result = await uplaodOnCloudinary(file.path);
                    if (!result || result instanceof Error) {
                        throw new ApiError(400, 'Failed to upload image');
                    }
                    return result;
                });

                uploadedImages = await Promise.all(uploadPromises);
            }

            // Create product
            const product = await prisma.product.create({
                data: {
                    name: validatedData.name,
                    description: validatedData.description,
                    price: validatedData.price,
                    material: validatedData.material,
                    images: uploadedImages,
                    fit: validatedData.fit,
                    brand: validatedData.brand,
                    featured: validatedData.featured,
                    inStock: true,
                    category: {
                        connect: { id: validatedData.categoryId },
                    },
                },
                include: {
                    category: true, 
                },
            });

            // Add the saved product to Redis cache for the category
            const cacheKey = `category_products:${categoryId}`;
            const cachedProducts = await redis.get(cacheKey);
            let products = [];
            if (cachedProducts) {
                try {
                    products = JSON.parse(cachedProducts);
                } catch {
                    products = [];
                }
            }
            products.push(product);
            await redis.set(cacheKey, JSON.stringify(products));

            logger.info(`Product created successfully with ID: ${product.id}`);
            return res
                .status(201)
                .json(
                    new ApiResponse(
                        201,
                        product,
                        'Product created with images successfully'
                    )
                );
        } catch (error) {
            logger.error('Error in addProductWithImages:', error);
            const appError =
                error instanceof ApiError
                    ? error
                    : new ApiError(500, 'Internal Server Error');
            return res.status(appError.statusCode).json(appError);
        }
    }
);
export const getAllProductsForCategory = asyncHandler(
    async (req: Request, res: Response) => {
        try {
            const { categoryId } = req.params;
            const cacheKey = `category_products:${categoryId}`;

            // Try to get products from Redis cache
            const cachedProducts = await redis.get(cacheKey);
            if (cachedProducts) {
                const products = JSON.parse(cachedProducts);
                return res.status(200).json(
                    new ApiResponse(200, products, 'Products fetched successfully (from cache)')
                );
            }

            // Fetch products for the given category from DB
            const products = await prisma.product.findMany({
                where: { categoryId },
                include: {
                    category: true,
                },
            });

            if (products.length === 0) {
                return res
                    .status(404)
                    .json(
                        new ApiError(
                            404,
                            'Not Found',
                            'No products found for this category'
                        )
                    );
            }

            // Store products in Redis cache for future requests
            await redis.set(cacheKey, JSON.stringify(products));

            res.status(200).json(
                new ApiResponse(200, products, 'Products fetched successfully')
            );
        } catch (error) {
            console.error('Error fetching products:', error);
            res.status(500).json(
                new ApiError(
                    500,
                    'Internal Server Error',
                    'An error occurred while fetching products'
                )
            );
        }
    }
);

export const deleteProductFromCategoryAndProduct = asyncHandler(
    async (req: Request, res: Response) => {
        try {
            const { productId, categoryId } = req.params;
            const cacheKey = `category_products:${categoryId}`;

            // Check if products for this category are cached
            const cachedProducts = await redis.get(cacheKey);
            if (cachedProducts) {
                // Expire the cache in 3 seconds
                await redis.expire(cacheKey, 3);
            }

            // Delete the product
            const deletedProduct = await prisma.product.delete({
                where: { id: productId },
            });

            // Remove the product from the category
            await prisma.category.update({
                where: { id: categoryId },
                data: {
                    products: {
                        disconnect: { id: productId },
                    },
                },
            });

            res.status(200).json(
                new ApiResponse(
                    200,
                    deletedProduct,
                    'Product deleted successfully'
                )
            );
        } catch (error) {
            console.error('Error deleting product:', error);
            res.status(500).json(
                new ApiError(
                    500,
                    'Internal Server Error',
                    'An error occurred while deleting the product'
                )
            );
        }
    }
);
