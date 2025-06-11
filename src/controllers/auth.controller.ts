import { type Request, type Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../../prisma/index';
import { asyncHandler } from '../utils/AsyncHandler';
import { ApiResponse } from '../utils/ApiResponse';
import { ApiError } from '../utils/ApiError';
import { tr } from 'zod/v4/locales';
import logger from '../utils/logger';

const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret_key';
export const registerOrLoginUser = asyncHandler(
    async (req: Request, res: Response) => {
        const { email, password, fullName, phoneNumber } = req.body;

        if (!email || !password) {
            throw new ApiError(400, 'Email and password are required');
        }

        const existingUser = await prisma.user.findUnique({ where: { email } });

        if (existingUser) {
            // Login flow
            const isPasswordCorrect = await bcrypt.compare(
                password,
                existingUser.password
            );
            if (!isPasswordCorrect) {
                throw new ApiError(
                    401,
                    'Account already exists, but password is incorrect'
                );
            }

            const token = jwt.sign(
                { userId: existingUser.id, email: existingUser.email },
                JWT_SECRET
            );

            const response = { token, user: existingUser };
            return res
                .status(200)
                .json(
                    new ApiResponse(
                        200,
                        response,
                        'Login successful'
                    )
                );
        }

        // Registration flow
        if (!fullName || !phoneNumber) {
            throw new ApiError(400, 'Full name and phone number are required for registration');
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const newUser = await prisma.user.create({
            data: {
                email,
                password: hashedPassword,
                fullName,
                role: 'USER',
                phone: phoneNumber,
            },
        });

        const token = jwt.sign(
            { userId: newUser.id, email: newUser.email },
            JWT_SECRET
        );
        return res
            .status(201)
            .json(
                new ApiResponse(
                    200,
                    { token, user: newUser },
                    'User registered successfully'
                )
            );
    }
);

export const logout = asyncHandler(async (_req: Request, res: Response) => {
    // Since JWT is stateless, logout can be handled client-side by deleting token
    // Optionally implement token blacklist on server for security
    res.status(200).json({ message: 'Logout successful' });
});

export const getMe = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.id;

    if (!userId) {
        throw new ApiError(401, 'User not authenticated');
    }

    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
            id: true,
            email: true,
            fullName: true,
            phone: true,
            role: true,
            address: true,
        },
    });

    if (!user) {
        throw new ApiError(404, 'User not found');
    }

    res.status(200).json(new ApiResponse(200, user, 'User retrieved successfully'));
});

// -----------------Admin Auth Controller-----------------

export const AdminRegisterOrLoginUser = asyncHandler(
    async (req: Request, res: Response) => {
        const { phoneNumber, email, password, fullName } = req.body;

        const existingUser = await prisma.user.findUnique({ where: { email } });

        if (existingUser) {
            const isPasswordCorrect = await bcrypt.compare(
                password,
                existingUser.password
            );
            if (!isPasswordCorrect) {
                throw new ApiError(
                    401,
                    'Account already exists, but password is incorrect'
                );
            }

            const token = jwt.sign(
            { userId: existingUser.id, email: existingUser.email },
            JWT_SECRET);

            const response={ token, user: existingUser }
            return res
                .status(200)
                .json(
                    new ApiResponse(
                        200,
                        response,
                        'Login successful'
                    )
                );
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const newUser = await prisma.user.create({
            data: {
                email,
                password: hashedPassword,
                fullName,
                role: 'ADMIN',
                phone: phoneNumber,
            },
        });

        const token = jwt.sign(
            { userId: newUser.id, email: newUser.email },
            JWT_SECRET);
        return res
            .status(201)
            .json(
                new ApiResponse(
                    200,
                    { token, user: newUser },
                    'Admin registered successfully'
                )
            );
    }
);

export const Adminlogout = asyncHandler(
    async (_req: Request, res: Response) => {
        // Since JWT is stateless, logout can be handled client-side by deleting token
        // Optionally implement token blacklist on server for security
        res.json({ message: 'Logout successful' });
    }
);

export const getAllUsers = asyncHandler(async (req: Request, res: Response) => {
    const users = await prisma.user.findMany({
        where:{
            role:"USER"
        },
        select: {
            id: true,
            email: true,
            fullName: true,
            phone: true,
            role: true,
            address: true,
        },
    });

    if (!users) {
        return res.status(404).json(new ApiError(404, 'No users found'));
    }

    res.json(new ApiResponse(200, users, 'All users retrieved successfully'));
});
