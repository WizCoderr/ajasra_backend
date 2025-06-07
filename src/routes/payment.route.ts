import express from 'express';
import { createRazorpayOrder, verifyPayment } from '../controllers/payment.controller';
import auth from '../middleware/auth.middleware';
const router = express.Router();

router.post('/razorpay/create-order/:id',auth, createRazorpayOrder);
router.post('/razorpay/verify', auth,verifyPayment);

export default router;
