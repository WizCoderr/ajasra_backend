import express from 'express';
import { register, getMe, login, logout , Adminlogin, Adminlogout , Adminregister ,getAllUsers } from '../controllers/auth.controller';
import { loginSchema, registerSchema, validate } from '../middleware/validation.middleware';
import adminAuth from '../middleware/auth.admin.middleware';
import auth from '../middleware/auth.middleware';

const router = express.Router();
// Routes for USER Accounts
router.post('/register', validate(registerSchema), register);
router.post('/login', validate(loginSchema), login);
router.post('/logout', auth,logout);
router.get('/me', auth,getMe);

// Routes for ADMIN Accounts
router.post('/admin/Register', Adminregister);
router.post('/admin/login', Adminlogin);
router.post('/admin/logout',adminAuth, Adminlogout);
router.get('/admin/all', adminAuth ,getAllUsers);


export default router;
