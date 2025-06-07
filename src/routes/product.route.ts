import express from 'express';
import { addProduct , getAllProductsForCategory ,deleteProductFromCategoryAndProduct} from '../controllers/product.controller';
import { upload } from '../middleware/multer.middleware';
import auth from '../middleware/auth.middleware';   
import adminAuth from '../middleware/auth.admin.middleware';
import logger from '../utils/logger';

const router = express.Router();
router.post(
    '/:categoryId/create',
    (req, res, next) => {
        logger.debug(`Creating product for category: ${req.params.categoryId}`);
        next();
    },
    upload.array('images', 5),
    adminAuth,
    addProduct
);
router.get(
    '/category/:categoryId',
    auth,
    (req, res, next) => {
        logger.debug(`Getting products for category: ${req.params.categoryId}`);
        next();
    },
    getAllProductsForCategory
);

router.delete(
    '/:productId/:categoryId',
    (req, res, next) => {
        logger.debug(`Deleting product ${req.params.productId} from category ${req.params.categoryId}`);
        next();
    },
    adminAuth,
    deleteProductFromCategoryAndProduct
);
export default router;
