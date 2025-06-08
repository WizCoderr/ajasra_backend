import jwt, { type JwtPayload } from 'jsonwebtoken';
import { type Request, type Response, type NextFunction } from 'express';
import { prisma } from '../../prisma';
import { asyncHandler } from '../utils/AsyncHandler';

const JWT_SECRET = process.env.JWT_SECRET as string;

const isUserAuthenticated = asyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const token = req.headers.authorization?.split(' ')[1]; // Bearer <token>
            if (!token) {
                return res.status(401).json({ message: 'No token provided' });
            }

            const decoded = jwt.verify(token, JWT_SECRET, { ignoreExpiration: true }) as JwtPayload;

            const user = await prisma.user.findUnique({
                where: { id: decoded.userId },
            });

            if (!user) {
                return res.status(403).json({ message: 'Unauthorized' });
            }

            req.user = user
            next();
        } catch (err: any) {
            console.error('JWT Verification Error:', err.message);
            res.status(401).json({ message: 'Invalid token' });
        }
    }
);

export default isUserAuthenticated;
