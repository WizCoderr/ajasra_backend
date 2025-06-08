import {type Request,type Response } from 'express';
import { prisma } from '../../prisma';
import { OrderStatus, PaymentStatus } from '@prisma/client';
import { ApiError } from '../utils/ApiError';
import  {handleAppError} from '../service/error.service';
import { ApiResponse } from '../utils/ApiResponse';
import {redis} from '../service/redis.service';
import { asyncHandler } from '../utils/AsyncHandler';


// 1️⃣ Place a new order
export const placeOrder = asyncHandler(async (req: Request, res: Response) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            throw new ApiError(400, 'User ID is required');
        }

        const { shippingAddress, billingAddress, paymentMethod } = req.body;

        const cart = await prisma.cart.findUnique({
            where: { userId },
            include: { items: { include: { product: true } } },
        });

        if (!cart || cart.items.length === 0) {
            throw new ApiError(400, 'Cart is empty');
        }

        const orderItems = cart.items.map((item: { productId: any; quantity: any; size: any; color: any; product: { price: any; }; }) => ({
            productId: item.productId,
            quantity: item.quantity,
            size: item.size,
            color: item.color,
            price: item.product.price,
        }));

        const subtotal = orderItems.reduce(
            (sum: number, item: { price: number; quantity: number; }) => sum + item.price * item.quantity,
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
                paymentMethod,
                status: OrderStatus.PENDING,
                paymentStatus: PaymentStatus.PENDING,
            },
            include: { items: true },
        });

        // Clear the cart
        await prisma.cartItem.deleteMany({ where: { cartId: cart.id } });

        // Invalidate user's orders cache
        await redis.del(`orders:user:${userId}`);

        res.status(201).json(new ApiResponse(201, newOrder, 'Order placed successfully'));
    } catch (err) {
        handleAppError(err);
    }
});

// 2️⃣ Get all orders for the current user
export const getMyOrders = asyncHandler(async (req: Request, res: Response) => {
    try {
        const userId = req.user?.id;

        // Try to get orders from Redis cache
        const cacheKey = `orders:user:${userId}`;
        const cachedOrders = await redis.get(cacheKey);
        if (cachedOrders) {
            return res.json(new ApiResponse(200, JSON.parse(cachedOrders), 'Orders fetched successfully (cache)'));
        }

        const orders = await prisma.order.findMany({
            where: { userId },
            include: { items: true },
            orderBy: { createdAt: 'desc' },
        });

        // Cache the result for 5 minutes
        await redis.set(cacheKey, JSON.stringify(orders));

        res.json(new ApiResponse(200, orders, 'Orders fetched successfully'));
    } catch (err) {
        handleAppError(err);
    }
});

export const getOrderById = asyncHandler(async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        // Try to get order from Redis cache
        const cacheKey = `order:${id}`;
        const cachedOrder = await redis.get(cacheKey);
        if (cachedOrder) {
            return res.json({ success: true, order: JSON.parse(cachedOrder) });
        }

        const order = await prisma.order.findUnique({
            where: { id },
            include: { items: true, user: true },
        });

        if (!order) throw new ApiError(404, 'Order not found');

        // Cache the result for 5 minutes
        await redis.set(cacheKey, JSON.stringify(order));

        res.json({ success: true, order });
    } catch (err) {
        handleAppError(err);

    }
});

// 4️⃣ Admin: Get all orders
export const getAllOrders = asyncHandler(async (req: Request, res: Response) => {
    try {
        // Try to get all orders from Redis cache
        const cacheKey = `orders:all`;
        const cachedOrders = await redis.get(cacheKey);
        if (cachedOrders) {
            return res.json({ success: true, orders: JSON.parse(cachedOrders) });
        }

        const orders = await prisma.order.findMany({
            include: { items: true, user: true },
            orderBy: { createdAt: 'desc' },
        });

        // Cache the result for 2 minutes
        await redis.set(cacheKey, JSON.stringify(orders));

        res.json({ success: true, orders });
    } catch (err) {
        handleAppError(err);
    }
});

// 5️⃣ Admin: Update order status
export const updateOrderStatus = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        const order = await prisma.order.update({
            where: { id },
            data: { status },
        });

        // Invalidate relevant caches
        await redis.del(`order:${id}`);
        await redis.del('orders:all');
        await redis.del(`orders:user:${order.userId}`);

        res.json({ success: true, message: 'Order status updated', order });
    } catch (err) {
        handleAppError(err);
    }
};
