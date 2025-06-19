import { type Request, type Response } from 'express';
import { prisma } from '../../prisma';
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

            // 1. Validate Category
            const category = await prisma.category.findUnique({
                where: { id: categoryId },
            });
            if (!category) {
                throw new ApiError(404, 'Category not found');
            }

            // 2. Check Required Fields
            const requiredFields = ['name', 'description', 'price', 'material', 'fit', 'brand'];
            const missingFields = requiredFields.filter(field => !req.body[field]);
            if (missingFields.length > 0) {
                throw new ApiError(400, `Missing required fields: ${missingFields.join(', ')}`);
            }

            // 3. Parse Body
            const parsedBody = {
                name: req.body.name,
                description: req.body.description,
                price: parseFloat(req.body.price),
                material: req.body.material,
                fit: (req.body.fit || '').toUpperCase(),
                brand: req.body.brand,
                featured: req.body.featured === 'true' || Boolean(req.body.featured),
                sizes: Array.isArray(req.body.sizes)
                    ? req.body.sizes
                    : JSON.parse(req.body.sizes || '[]'),
                colors: Array.isArray(req.body.colors)
                    ? req.body.colors
                    : JSON.parse(req.body.colors || '[]'),
                categoryId,
            };

            // 4. Validate with Zod
            const validatedData = createProductSchema.parse(parsedBody);
            const allowedFits = ['SLIM', 'REGULAR'];
            if (!allowedFits.includes(validatedData.fit)) {
                throw new ApiError(400, 'Invalid fit. Must be SLIM or REGULAR');
            }

            // 5. Upload Images to Cloudinary
            const uploadedImages: string[] = [];
            if (req.files && Array.isArray(req.files)) {
                for (const file of req.files) {
                    const url = await uplaodOnCloudinary(file.path);
                    
                    uploadedImages.push(url);
                }
            }

            // 6. Create Product in DB
            const product = await prisma.product.create({
                data: {
                    name: validatedData.name,
                    description:validatedData.description,
                    price: validatedData.price,
                    images: uploadedImages,
                    sizes: validatedData.sizes,
                    brand: validatedData.brand,
                    colors: validatedData.colors,
                    fit : validatedData.fit,
                    material: validatedData.material,
                    inStock: true,
                    category: {
                        connect: { id: validatedData.categoryId },
                    },
                },
                include: {
                    category: true,
                },
            });

            // 7. Cache to Redis
            const cacheKey = `category_products:${categoryId}`;
            const cached = await redis.get(cacheKey);
            let products = [];

            if (cached) {
                try {
                    products = JSON.parse(cached);
                } catch {
                    logger.warn(`Invalid JSON cache at ${cacheKey}`);
                    products = [];
                }
            }

            products.push(product);
            await redis.set(cacheKey, JSON.stringify(products));

            // 8. Respond
            logger.info(`Product created: ${product.id}`);
            return res.status(201).json(
                new ApiResponse(201, product, 'Product created successfully with images')
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
                return res
                    .status(200)
                    .json(
                        new ApiResponse(
                            200,
                            products,
                            'Products fetched successfully (from cache)'
                        )
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
export const updateStockEntry = asyncHandler(
    async (req: Request, res: Response) => {
        const { productId } = req.params;
        const { inStock } = req.body;

        // Find the product to get its categoryId
        const product = await prisma.product.findUnique({
            where: { id: productId },
            select: { categoryId: true },
        });

        if (!product) {
            return res.status(404).json(new ApiError(404, 'Product not found'));
        }

        const cacheKey = `category_products:${product.categoryId}`;
        let products: any[] = [];

        // Check if products for this category are cached
        const cachedProducts = await redis.get(cacheKey);
        if (cachedProducts) {
            try {
                products = JSON.parse(cachedProducts);
                // Update the inStock value for the product in cache
                const index = products.findIndex(
                    (p: any) => p.id === productId
                );
                if (index !== -1) {
                    products[index].inStock = inStock;
                }
            } catch {
                products = [];
            }
        }

        // Update the product in the database
        const updatedProduct = await prisma.product.update({
            where: { id: productId },
            data: { inStock: inStock },
        });

        // If cache was present, update it
        if (cachedProducts) {
            await redis.set(cacheKey, JSON.stringify(products));
        }

        logger.info('Product updated Successfully');
        res.status(200).json(
            new ApiResponse(200, updatedProduct, 'Product Updated Successfully')
        );
    }
);

export const getAllProducts = asyncHandler(
    async (req: Request, res: Response) => {
        const products = await prisma.product.findMany();
        if (!products) {
            res.status(400).json(new ApiError(400, 'Product Not Found'));
        }
        res.status(200).json(
            new ApiResponse(200, products, 'All Products are here')
        );
    }
);
