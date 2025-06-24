import {type Request, type Response} from 'express';
import {prisma} from '../../prisma';
import {asyncHandler} from '../utils/AsyncHandler';
import {ApiResponse} from '../utils/ApiResponse';
import {ApiError} from '../utils/ApiError';
import {uplaodOnCloudinary} from '../service/cloudanery.service';
import {redis} from '../service/redis.service';
import logger from '../utils/logger';
export const getCategories = asyncHandler(async (req: Request, res: Response) => {
    const categories = await prisma.category.findMany({
        include: {
            products: true,
        },
    });

    if (!categories || categories.length === 0) {
        return res.status(404).json(new ApiError(404, "No categories found"));
    }

    res.status(200).json(new ApiResponse(200, categories, "Categories retrieved successfully"));
});


export const createCategory = asyncHandler(async (req: Request, res: Response) => {
    try {
        logger.info('Creating a new category...');

        const { name, description, category_img } = req.body;

        // 1. Required field validation
        const missingFields = [];
        if (!name) missingFields.push('name');
        if (!description) missingFields.push('description');
        if (!category_img) missingFields.push('category_img');

        if (missingFields.length > 0) {
            throw new ApiError(400, `Missing required fields: ${missingFields.join(', ')}`);
        }

        // 2. Create the category in DB
        const newCategory = await prisma.category.create({
            data: {
                name,
                description,
                image: category_img.toString(),
            },
            include: {
                products: true,
            },
        });

        // 3. Update Redis cache
        const cachedCategories = await redis.get('categories');
        if (cachedCategories) {
            const categories = JSON.parse(cachedCategories);
            categories.push(newCategory);
            await redis.set('categories', JSON.stringify(categories));
        } else {
            await redis.set('categories', JSON.stringify([newCategory]));
        }

        logger.info('Category created successfully');
        return res.status(201).json(new ApiResponse(201, newCategory, 'Category created successfully'));
    } catch (error) {
        logger.error('Error in createCategory:', error);
        const appError = error instanceof ApiError ? error : new ApiError(500, 'Internal Server Error');
        return res.status(appError.statusCode).json(appError);
    }
});


// Grt Products from categoryName
export const getProductsForCategoryByName = asyncHandler(
    async (req: Request, res: Response) => {
        const { categoryName } = req.params;

        // Try to get products from Redis cache
        const cacheKey = `category_products:${categoryName}`;
        const cachedProducts = await redis.get(cacheKey);
        if (cachedProducts) {
            const products = JSON.parse(cachedProducts);
            return res.status(200).json(new ApiResponse(200, products, "Products retrieved successfully (from cache)"));
        }

        const category = await prisma.category.findFirst({
            where: {
                name: categoryName
            },
            select: {
                products: true
            }
        });

        if (!category) {
            return res.status(404).json(new ApiError(404, "Category not found"));
        }

        // Store products in Redis cache
        await redis.set(cacheKey, JSON.stringify(category.products));

        res.status(200).json(new ApiResponse(200, category.products, "Products retrieved successfully"));
    }
)