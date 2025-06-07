import {type Request,type Response } from 'express';
import { prisma } from '../../prisma';
import { OrderStatus, PaymentStatus } from '@prisma/client';
import { ApiError } from '../utils/ApiError';
import  {handleAppError} from '../service/error.service';
import { ApiResponse } from '../utils/ApiResponse';

// 1️⃣ Place a new order
export const placeOrder = async (req: Request, res: Response) => {
    try {
        const userId = req.params.id;
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

        res.status(201).json(new ApiResponse(201, newOrder, 'Order placed successfully'));
    } catch (err) {
        handleAppError(err);
    }
};

// 2️⃣ Get all orders for the current user
export const getMyOrders = async (req: Request, res: Response) => {
    try {
        const userId = req.params.userId;
        const orders = await prisma.order.findMany({
            where: { userId },
            include: { items: true },
            orderBy: { createdAt: 'desc' },
        });

        res.json(new ApiResponse(200,orders, 'Orders fetched successfully'));
    } catch (err) {
        handleAppError(err);
    }
};

export const getOrderById = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        const order = await prisma.order.findUnique({
            where: { id },
            include: { items: true, user: true },
        });

        if (!order) throw new ApiError(404, 'Order not found');


        res.json({ success: true, order });
    } catch (err) {
        handleAppError(err);

    }
};

// 4️⃣ Admin: Get all orders
export const getAllOrders = async (_req: Request, res: Response) => {
    try {
        const orders = await prisma.order.findMany({
            include: { items: true, user: true },
            orderBy: { createdAt: 'desc' },
        });

        res.json({ success: true, orders });
    } catch (err) {
        handleAppError(err);
    }
};

// 5️⃣ Admin: Update order status
export const updateOrderStatus = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        const order = await prisma.order.update({
            where: { id },
            data: { status },
        });

        res.json({ success: true, message: 'Order status updated', order });
    } catch (err) {
        handleAppError(err);
    }
};
