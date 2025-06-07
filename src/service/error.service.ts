import { ZodError } from 'zod';
import { Prisma } from '@prisma/client';
import { ErrorType } from '../utils/constents';
import { ApiError } from '../utils/ApiError';

export const handleAppError = (error: any): ApiError => {
    if (error instanceof ZodError) {
        return new ApiError(
            400,
            ErrorType.VALIDATION_ERROR,
            error.errors.map((e) => e.message).join(', ')
        );
    }

    if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
            return new ApiError(
                409,
                ErrorType.DUPLICATE_ENTRY,
                'Duplicate entry exists.'
            );
        }

        return new ApiError(
            500,
            ErrorType.DATABASE_ERROR,
            'A database error occurred.'
        );
    }

    if (error instanceof Prisma.PrismaClientValidationError) {
        return new ApiError(
            400,
            ErrorType.VALIDATION_ERROR,
            'Invalid data format for database.'
        );
    }

    if (error instanceof Prisma.PrismaClientInitializationError) {
        return new ApiError(
            500,
            ErrorType.INTERNAL_SERVER_ERROR,
            'Database failed to initialize.'
        );
    }

    if (error instanceof ApiError) {
        return error; // Already a handled ApiError
    }

    if (error instanceof TypeError) {
        return new ApiError(
            500,
            ErrorType.INTERNAL_SERVER_ERROR,
            'Type error occurred'
        );
    }

    if (error instanceof ReferenceError) {
        return new ApiError(
            500,
            ErrorType.INTERNAL_SERVER_ERROR,
            'Reference error occurred'
        );
    }

    if (error instanceof SyntaxError) {
        return new ApiError(
            500,
            ErrorType.INTERNAL_SERVER_ERROR,
            'Syntax error occurred'
        );
    }

    if (error instanceof RangeError) {
        return new ApiError(
            500,
            ErrorType.INTERNAL_SERVER_ERROR,
            'Range error occurred'
        );
    }

    return new ApiError(
        500,
        ErrorType.INTERNAL_SERVER_ERROR,
        'An unexpected error occurred.'
    );
};

