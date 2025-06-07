import jwt, { type JwtPayload } from 'jsonwebtoken';
import { type Request, type Response, type NextFunction } from 'express';
import { prisma } from '../../prisma';
import { asyncHandler } from '../utils/AsyncHandler';

const JWT_SECRET = process.env.JWT_SECRET as string; // Fallback for dev

const isadminAuthenticated = asyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const token = req.headers.authorization?.split(' ')[1]; // Bearer <token>
            if (!token) {
                return res.status(401).json({ message: 'No token provided' });
            }

            const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;

            const admin = await prisma.user.findUnique({
                where: { id: decoded.userId },
            });

            if (!admin) {
                return res.status(403).json({ message: 'Unauthorized' });
            }
            if (admin.role !== 'ADMIN') {
                return res.status(403).json({ message: 'Forbidden: Admin access required' });
            }

            req.admin = admin;
            next();
        } catch (err: any) {
            console.error('JWT Verification Error:', err.message);
            res.status(401).json({ message: 'Invalid or expired token' });
        }
    }
);
export default isadminAuthenticated;
