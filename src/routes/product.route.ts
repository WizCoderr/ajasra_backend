import express from 'express';
import {
    addProduct,
    getAllProducts,
    getAllProductsForCategory,
    deleteProductFromCategoryAndProduct,
    updateStockEntry,
    getFeaturedProducts,
} from '../controllers/product.controller';
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
    (req, res, next) => {
        logger.debug(`Getting products for category: ${req.params.categoryId}`);
        next();
    },
    getAllProductsForCategory
);

router.get(
    '/',
    (req, res, next) => {
        logger.debug('Getting All Products');
        next();
    },
    getAllProducts
);
router.get(
    '/featured',
    (req, res, next) => {
        logger.debug("Fetures Products")
        next();
    },
    getFeaturedProducts
)

router.put(
    '/:productId/updateStock',
    (req, res, next) => {
        logger.debug(`Updating product ${req.params.productId}`);
        next();
    },
    adminAuth,
    updateStockEntry
);
router.delete(
    '/:productId/:categoryId',
    (req, res, next) => {
        logger.debug(
            `Deleting product ${req.params.productId} from category ${req.params.categoryId}`
        );
        next();
    },
    adminAuth,
    deleteProductFromCategoryAndProduct
);
export default router;
