import { type Request, type Response } from 'express';
import { prisma } from '../../prisma';
import { OrderStatus, PaymentStatus } from '@prisma/client';
import { ApiError } from '../utils/ApiError';
import { handleAppError } from '../service/error.service';
import { ApiResponse } from '../utils/ApiResponse';
import { redis } from '../service/redis.service';
import { asyncHandler } from '../utils/AsyncHandler';
import logger from '../utils/logger';

/**
 * Place a new order for the logged-in user
 */
export const placeOrder = asyncHandler(async (req: Request, res: Response) => {
    try {
        const userId = req.user?.id;
        if (!userId) throw new ApiError(400, 'User ID is required');

        const { shippingAddress, billingAddress } = req.body;

        const cart = await prisma.cart.findUnique({
            where: { userId },
            include: { items: { include: { product: true } } },
        });

        if (!cart || cart.items.length === 0) {
            throw new ApiError(400, 'Cart is empty');
        }

        const orderItems = cart.items.map((item) => ({
            productId: item.productId,
            quantity: item.quantity,
            size: item.size,
            color: item.color,
            price: item.product.price,
        }));

        const subtotal = orderItems.reduce(
            (sum, item) => sum + item.price * item.quantity,
            0
        );
        const tax = +(subtotal * 0.18).toFixed(2); // 18% GST
        const shipping = 50;
        const total = subtotal + tax + shipping;

        const newOrder = await prisma.order.create({
            data: {
                userId,
                items: { create: orderItems },
                subtotal,
                tax,
                shipping,
                total,
                shippingAddress,
                billingAddress,
            },
            include: { items: true },
        });

        // Clear cart after placing order
        await prisma.cartItem.deleteMany({ where: { cartId: cart.id } });

        // Clear order cache
        await redis.del(`orders:user:${userId}`);

        res.status(201).json(
            new ApiResponse(201, newOrder, 'Order placed successfully')
        );
    } catch (err) {
        handleAppError(err);
    }
});

/**
 * Get orders of current user
 */
export const getMyOrders = asyncHandler(async (req: Request, res: Response) => {
    try {
        const userId = req.user?.id;
        const cacheKey = `orders:user:${userId}`;

        const cachedOrders = await redis.get(cacheKey);
        if (cachedOrders) {
            return res.json(
                new ApiResponse(
                    200,
                    JSON.parse(cachedOrders),
                    'Orders fetched from cache'
                )
            );
        }

        const orders = await prisma.order.findMany({
            where: { userId },
            include: { items: true },
            orderBy: { createdAt: 'desc' },
        });

        await redis.set(cacheKey, JSON.stringify(orders));

        res.json(new ApiResponse(200, orders, 'Orders fetched successfully'));
    } catch (err) {
        handleAppError(err);
    }
});

/**
 * Get single order by ID
 */
export const getOrderById = asyncHandler(
    async (req: Request, res: Response) => {
        try {
            const { id } = req.params;
            const cacheKey = `order:${id}`;

            const cachedOrder = await redis.get(cacheKey);
            if (cachedOrder) {
                return res.json({
                    success: true,
                    order: JSON.parse(cachedOrder),
                });
            }

            const order = await prisma.order.findUnique({
                where: { id },
                include: { items: true, user: true },
            });

            if (!order) throw new ApiError(404, 'Order not found');

            await redis.set(cacheKey, JSON.stringify(order));

            res.json({ success: true, order });
        } catch (err) {
            handleAppError(err);
        }
    }
);

/**
 * Admin: Get all orders
 */
export const getAllOrders = asyncHandler(
    async (req: Request, res: Response) => {
        try {
            const orders = await prisma.order.findMany({
                include: { items: true, user: true },
            });

            res.json(new ApiResponse(200,orders,"Orders"));
        } catch (err) {
            handleAppError(err);
        }
    }
);

/**
 * Admin: Update status of an order
 */
export const updateOrderStatus = asyncHandler(
    async (req: Request, res: Response) => {
        try {
            const { id } = req.params;
            const { status } = req.body;

            const order = await prisma.order.update({
                where: { id },
                data: { status },
            });

            // Clear all caches
            await redis.del(`order:${id}`);
            await redis.del('orders:all');
            await redis.del(`orders:user:${order.userId}`);

            res.json({ success: true, message: 'Order status updated', order });
        } catch (err) {
            handleAppError(err);
        }
    }
);

export const addItemToCart = asyncHandler(
    async (req: Request, res: Response) => {
        const userId = req.params.userId;
        logger.info(`Making Cart for ${userId}`)
        const { productId, quantity, size, color } = req.body;

        if (!userId || !productId || !quantity || !size || !color) {
            throw new ApiError(400, 'Missing required fields');
        }

        logger.info('upserting cart')
        // 🛒 Upsert the cart
        const cart = await prisma.cart.upsert({
            where: { userId },
            update: {},
            create: { userId },
        });

        // 🔍 Check if item already exists
        logger.info('🔍 Check if item already exists')
        const existingItem = await prisma.cartItem.findFirst({
            where: {
                cartId: cart.id,
                productId,
                size,
                color,
            },
        });

        if (existingItem) {
            await prisma.cartItem.update({
                where: { id: existingItem.id },
                data: {
                    quantity: existingItem.quantity + quantity,
                },
            });
        } else {
            await prisma.cartItem.create({
                data: {
                    cartId: cart.id,
                    productId,
                    quantity,
                    size,
                    color,
                },
            });
        }
        logger.info('Fetching full Cart')
        // ✅ Fetch full cart with items populated
        const updatedCart = await prisma.cart.findUnique({
            where: { id: cart.id },
            include: {
                items: {
                    include: {
                        product: true, // optional: to also include product info
                    },
                },
            },
        });

        res.status(200).json(
            new ApiResponse(200, updatedCart, 'Item added and cart updated')
        );
    }
);

export const seeCart = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.params.userId;

    if (!userId) {
        throw new ApiError(400, 'User ID is required');
    }

    const cart = await prisma.cart.findUnique({
        where: { userId },
        include: {
            items: {
                include: {
                    product: true,
                },
            },
        },
    });

    if (!cart) {
        res.status(200).json({
            "size": 0
        })
    }

    res.status(200).json(
        new ApiResponse(200, cart, 'Cart fetched successfully')
    );
});
export const deleteItemFromCart = asyncHandler(
    async (req: Request, res: Response) => {
        const userId = req.params.userId;
        const { productId, size, color } = req.body;

        if (!userId || !productId) {
            throw new ApiError(400, 'Missing required fields');
        }

        const cart = await prisma.cart.findUnique({
            where: { userId },
        });

        if (!cart) {
            throw new ApiError(404, 'Cart not found');
        }

        const deleted = await prisma.cartItem.deleteMany({
            where: {
                cartId: cart.id,
                productId,
                size,
                color,
            },
        });

        if (deleted.count === 0) {
            throw new ApiError(404, 'Cart item not found');
        }

        res.status(200).json(
            new ApiResponse(200, null, 'Item removed from cart')
        );
    }
);
