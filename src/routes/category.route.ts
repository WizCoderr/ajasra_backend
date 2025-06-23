import express from 'express';
import { getCategories, createCategory ,getProductsForCategoryByName} from '../controllers/category.controller';
import { upload } from '../middleware/multer.middleware';
import adminAuth from '../middleware/auth.admin.middleware';
const router = express.Router();

// Route to get all categories
router.get('/',getCategories);
// Route to create a new category with image upload
router.post('/',adminAuth, createCategory);
router.get('/:categoryName',getProductsForCategoryByName)

export default router;