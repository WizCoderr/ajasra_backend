import {type Request, type Response} from 'express';
import {prisma} from '../../prisma';
import {asyncHandler} from '../utils/AsyncHandler';
import {ApiResponse} from '../utils/ApiResponse';
import {ApiError} from '../utils/ApiError';
import {uplaodOnCloudinary} from '../service/cloudanery.service';
import {redis} from '../service/redis.service';
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


// Create a new category
export const createCategory = asyncHandler(async (req: Request, res: Response) => {
    const { name, description  } = req.body;

    if (!name || !description) {
        return res.status(400).json(new ApiError(400, "Name and description are required"));
    }

    // If using multer with multiple files (fields), use req.files and type assertion
    const files = req.files as { [fieldname: string]: Express.Multer.File[] } | undefined;
    const filePath = files?.['category_img']?.[0];
    if (!filePath) {
        return res.status(400).json(new ApiError(400, "Category image is required"));
    }

    const category_img = await uplaodOnCloudinary(filePath.path);
    if (!category_img) {
        throw new ApiError(500, "Failed to upload category image");
    }
    const newCategory = await prisma.category.create({
        data: {
            name,
            description,
            image: category_img.toString()
        },
        include: {
            products: true,
        },
    });

    // Update the Redis cache for categories
    const cachedCategories = await redis.get('categories');
    if (cachedCategories) {
        const categories = JSON.parse(cachedCategories);
        categories.push(newCategory);
        await redis.set('categories', JSON.stringify(categories));
    } else {
        await redis.set('categories', JSON.stringify([newCategory]));
    }

    res.status(201).json(new ApiResponse(201, newCategory, "Category created successfully"));
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