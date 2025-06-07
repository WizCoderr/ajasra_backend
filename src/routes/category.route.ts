import express from 'express';
import { getCategories, createCategory } from '../controllers/category.controller';
import { upload } from '../middleware/multer.middleware';
import adminAuth from '../middleware/auth.admin.middleware';
import auth from '../middleware/auth.middleware';
const router = express.Router();

// Route to get all categories
router.get('/',getCategories);
// Route to create a new category with image upload
router.post('/', upload.fields([{ name: 'category_img', maxCount: 1 }]),adminAuth, createCategory);


export default router;