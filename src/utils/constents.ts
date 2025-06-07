export enum ErrorType {
    VALIDATION_ERROR = 'VALIDATION_ERROR',
    AUTH_ERROR = 'AUTH_ERROR',
    NOT_FOUND = 'NOT_FOUND',
    PERMISSION_DENIED = 'PERMISSION_DENIED',
    BAD_REQUEST = 'BAD_REQUEST',
    INTERNAL_SERVER_ERROR = 'INTERNAL_SERVER_ERROR',
    DATABASE_ERROR = 'DATABASE_ERROR',
    IMAGE_UPLOAD_ERROR = 'IMAGE_UPLOAD_ERROR',
    DUPLICATE_ENTRY = 'DUPLICATE_ENTRY',
}

// src/config/razorpay.ts
import Razorpay from 'razorpay';

export const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID!,
    key_secret: process.env.RAZORPAY_SECRET_KEY!,
});
