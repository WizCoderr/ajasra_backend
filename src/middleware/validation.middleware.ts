import { z, ZodError } from 'zod';
import { type Request, type Response, type NextFunction } from 'express';

export const registerSchema = z.object({
    fullname: z.string().min(1, 'Full name is required'),
    phoneNumber: z.string().min(10, 'Phone number must be at least 10 characters long'),
    email: z.string().email('A valid email is required'),
    password: z.string().min(6, 'Password must be at least 6 characters long'),
});

export const loginSchema = z.object({
    email: z.string().email('A valid email is required'),
    password: z.string().min(6, 'Password must be at least 6 characters long'),
});

export const parseProductFields = (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        req.body.price = parseFloat(req.body.price);
        req.body.featured = req.body.featured === 'true';

        req.body.sizes = JSON.parse(req.body.sizes || '[]');
        req.body.colors = JSON.parse(req.body.colors || '[]');

        next();
    } catch (err) {
        return res.status(400).json({
            success: false,
            message: 'Invalid JSON format in sizes or colors field',
        });
    }
};
export const addressSchema = z.object({
    street: z.string().min(1, 'Street is required'),
    city: z.string().min(1, 'City is required'),
    state: z.string().min(1, 'State is required'),
    postalCode: z.string().min(1, 'Postal code is required'),
    country: z.string().min(1, 'Country is required'),
});
const fitEnum = z.enum(['SLIM', 'REGULAR']);

export const createProductSchema = z.object({
    name: z.string().min(1, 'Product name is required'),
    description: z.string().min(1, 'Description is required'),
    price: z.number().positive('Price must be greater than zero'),
    material: z.string().min(1, 'Material is required'),
    fit: fitEnum,
    images: z.array(z.string()),
    brand: z.string().min(1, 'Brand is required'),
    featured: z.boolean(),
    sizes: z.array(z.string())
        .nonempty('At least one size is required'),
    colors: z.array(z.string())
        .nonempty('At least one color is required'),

    categoryId: z.string().length(24, 'Invalid MongoDB ObjectId'),
});

export const validate = (schema: z.ZodSchema) => {
    return (req: Request, res: Response, next: NextFunction) => {
        try {
            schema.parse(req.body);
            next();
        } catch (err) {
            if (err instanceof ZodError) {
                res.status(400).json({
                    error: err.errors
                        .map((error: { message: string }) => error.message)
                        .join(', '),
                });
            } else {
                res.status(500).json({ error: 'Internal server error' });
            }
        }
    };
};
