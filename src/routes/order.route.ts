import express from 'express';
import {
    placeOrder,
    getMyOrders,
    getOrderById,
    getAllOrders,
    updateOrderStatus,
} from '../controllers/order.controller';
import auth from '../middleware/auth.middleware';
import authAdmin from '../middleware/auth.admin.middleware';
const router = express.Router();

// 🧾 Authenticated user routes
router.post('/:userId', auth, placeOrder);
router.get('/:userId', auth, getMyOrders);
router.get('/:id', auth, getOrderById);

// 🔐 Admin routes
router.get('/admin/all', authAdmin, getAllOrders);
router.patch('/admin/:id', authAdmin, updateOrderStatus);

export default router;
