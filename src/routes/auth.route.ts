import express from 'express';
import { registerOrLoginUser, AdminRegisterOrLoginUser, getMe, logout ,  Adminlogout  ,getAllUsers } from '../controllers/auth.controller';
import adminAuth from '../middleware/auth.admin.middleware';
import auth from '../middleware/auth.middleware';

const router = express.Router();
// Routes for USER Accounts
router.post('/register', registerOrLoginUser);
router.post('/logout', auth,logout);
router.get('/me', auth,getMe);

// Routes for ADMIN Accounts
router.post('/admin/register', AdminRegisterOrLoginUser);
router.post('/admin/logout',adminAuth, Adminlogout);
router.get('/admin/all', adminAuth ,getAllUsers);


export default router;
