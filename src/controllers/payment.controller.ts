import { type Request, type Response } from 'express';
import { razorpay } from '../utils/constents';
import { prisma } from '../../prisma';
import crypto from 'crypto';
import { ApiError } from '../utils/ApiError';

export const createRazorpayOrder = async (req: Request, res: Response) => {
    const userId = req.params.id;

    if (!userId) {
        throw new ApiError(401, 'Unauthorized');
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

    if (!cart || cart.items.length === 0) {
        throw new ApiError(400, 'Cart is empty');
    }

    const amount = cart.items.reduce((total, item) => {
        return total + item.product.price * item.quantity;
    }, 0);

    const options = {
        amount: Math.round(amount * 100),
        currency: 'INR',
        receipt: `rcpt_${Date.now()}`,
    };

    try {
        const order = await razorpay.orders.create(options);
        res.status(200).json({ order });
    } catch (error) {
        console.error(error);
        throw new ApiError(500, 'Razorpay order creation failed');
    }
};
export const verifyPayment = async (req: Request, res: Response) => {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } =
        req.body;

    const generated_signature = crypto
        .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET!)
        .update(`${razorpay_order_id}|${razorpay_payment_id}`)
        .digest('hex');

    if (generated_signature !== razorpay_signature) {
        throw new ApiError(400, 'Invalid payment signature');
    }

    res.status(200).json({
        success: true,
        message: 'Payment verified successfully',
    });
};
