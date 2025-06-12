import express, {
    type Application,
    type Request,
    type Response,
    type NextFunction,
} from 'express';
import helmet from 'helmet';
import dotenv from 'dotenv';
import './service/redis.service';
import logger from './utils/logger';
import { ApiError } from './utils/ApiError';
import cors from 'cors';
dotenv.config({
    path: './.env',
});

const app: Application = express();
const PORT = process.env.PORT || 9000;

app.use(
    cors({
        origin: "172.31.128.1:3001"
    })
);
// Middleware
app.use(helmet());

app.use(express.json());
app.use(express.static('public'));
app.use(express.urlencoded({ extended: true }));

// Routes
import authRoutes from './routes/auth.route';
import categoryRoutes from './routes/category.route';
import productRoutes from './routes/product.route';
import wishlistRoute from './routes/wishlist.route';
import addressRoute from './routes/user.address.route';
import orderRoute from './routes/order.route';
import paymentRoute from './routes/payment.route';
// Use routes
app.use('/api/auth', authRoutes);
app.use('/api/category', categoryRoutes);
app.use('/api/product', productRoutes);
app.use('/api/wishlist', wishlistRoute);
app.use('/api/address', addressRoute);
app.use('/api/order', orderRoute);
app.use('/payment', paymentRoute);
app.get('/health', (_req, res) => {
    res.json({ status: 'OK', message: 'Server is running' });
});
app.get('/health', (req, res) => {
    res.json({ status: 'OK', message: 'Server is running' });
    app.use((err: Error, req: Request, res: Response, _next: NextFunction) => {
        logger.error('Unhandled Error:', {
            error: err.message,
            stack: err.stack,
            path: req.path,
            method: req.method,
        });
        res.status(500).json(new ApiError(500, 'Internal Server Error'));
    });
});

// Start server
app.listen(PORT, () => {
    logger.info(`Server is running on port ${PORT}`);
    logger.info(`Environment: ${process.env.NODE_ENV}`);
    logger.info(`Cors is enabled for: ${cors.length}`)
});
