import { type User } from '@prisma/client';

declare global {
    namespace Express {
        interface Request {
            user?: User; // Authenticated user
            cartId?: string; // Cart ID for the user
            wishlistId?: string; // Wishlist ID for the user
            orderId?: string; // Order ID for the user
            paymentId?: string; // Payment ID for the user
        }

        interface Response {
            sendApiResponse: (data: any, message?: string) => void; // Custom method to send API responses
        }
    }
}
