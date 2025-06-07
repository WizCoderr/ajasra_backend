import {type Request,type Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import {prisma} from '../../prisma/index'
import {asyncHandler} from '../utils/AsyncHandler';
import { ApiResponse } from '../utils/ApiResponse';
import { ApiError } from '../utils/ApiError';

const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret_key';
const JWT_EXPIRES_IN = '1d';
export const register = asyncHandler(async (req: Request, res: Response) => {
    const { phoneNumber,email, password, fullName } = req.body;

    if (!email || !password || !fullName || !phoneNumber) {
        return res.status(400).json(new ApiError(400, "All fields are required"));
    }

    // Check if user exists
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
        return res.status(409).json(new ApiError(409, "User already exists with this email"));
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const user = await prisma.user.create({
        data: {
            email,
            password: hashedPassword,
            fullName: fullName,
            role: 'USER',
            phone: phoneNumber,
        },
    });

    // Generate JWT token
    const token = jwt.sign(
        { userId: user.id, email: user.email },
        JWT_SECRET,
        {
            expiresIn: JWT_EXPIRES_IN,
        }
    );

    const response = {
        token:token,
        user:user
    }
    res.status(201).json(new ApiResponse(200,response,"User Registered Successfully"));
});

export const login = asyncHandler(async (req: Request, res: Response) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json(new ApiError(400, "Email and password are required"));
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
        return res.status(401).json(new ApiError(401, "Invalid email or password"));
    }

    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
        return res.status(401).json(new ApiError(401, "Invalid email or password"));

    }

    const token = jwt.sign(
        { userId: user.id, email: user.email },
        JWT_SECRET,
        {
            expiresIn: JWT_EXPIRES_IN,
        }
    );

    const response = {
        token: token,
        user: user,
    };
    res.json(new ApiResponse(200, response, "Login successful"));
});

export const logout = asyncHandler(async (_req: Request, res: Response) => {
    // Since JWT is stateless, logout can be handled client-side by deleting token
    // Optionally implement token blacklist on server for security
    res.json({ message: 'Logout successful' });
});

export const getMe = asyncHandler(async (req: Request, res: Response) => {
    const userId = (req as any).userId;

    if (!userId) {
        return res.status(401).json({ message: 'Unauthorized' });
    }

    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
            id: true,
            email: true,
            fullName: true,
            phone: true,
            role: true,
        },
    });

    if (!user) {
        return res.status(404).json({ message: 'User not found' });
    }

    res.json({ user });
});



// -----------------Admin Auth Controller-----------------


export const Adminregister = asyncHandler(async (req: Request, res: Response) => {
    const { phoneNumber, email, password,fullName } = req.body;

    if (!email || !password || !fullName || !phoneNumber || typeof phoneNumber !== 'string' || phoneNumber.trim() === '') {
        return res.status(400).json(new ApiError(400, "All fields are required and phoneNumber must be a non-empty string"));
    }

    // // Check if user exists
    // const existingUser = await prisma.user.findUnique({ where: { email } });
    // if (existingUser) {
    //     return res.status(409).json(new ApiError(409, "User already exists with this email"));
    // }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const user = await prisma.user.create({
        data: {
            email,
            password: hashedPassword,
            fullName,
            role: 'ADMIN',
            phone: phoneNumber
        },
    });

    // Generate JWT token
    const token = jwt.sign(
        { userId: user.id, email: user.email },
        JWT_SECRET,
        {
            expiresIn: JWT_EXPIRES_IN,
        }
    );

    const response = {
        token:token,
        user: user
    }
    res.status(201).json(new ApiResponse(200,response,"User Registered Successfully"));
});

export const Adminlogin = asyncHandler(async (req: Request, res: Response) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json(new ApiError(400, "Email and password are required"));
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
        return res.status(401).json(new ApiError(401, "Invalid email or password"));
    }

    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
        return res.status(401).json(new ApiError(401, "Invalid email or password"));

    }

    const token = jwt.sign(
        { userId: user.id, email: user.email },
        JWT_SECRET,
        {
            expiresIn: JWT_EXPIRES_IN,
        }
    );

    const response = {
        token: token,
        user: user
    };
    res.json(new ApiResponse(200, response, "Login successful"));
});

export const Adminlogout = asyncHandler(async (_req: Request, res: Response) => {
    // Since JWT is stateless, logout can be handled client-side by deleting token
    // Optionally implement token blacklist on server for security
    res.json({ message: 'Logout successful' });
});

export const getAllUsers = asyncHandler(async (req: Request, res: Response) => {
    const users = await prisma.user.findMany({
        select: {
            id: true,
            email: true,
            fullName: true,
            phone: true,
            role: true,
            createdAt: true,
            updatedAt: true,
        },
    });

    if (!users) {
        return res.status(404).json(new ApiError(404, "No users found"));
    }

    res.json( new ApiResponse(200, users, "All users retrieved successfully"));
});
