import express from 'express';
import {
    getAllProducts,
    addProduct,
    getAllProductsForCategory,
    deleteProductFromCategoryAndProduct,
    updateStockEntry,
    getFeaturedProducts,
    updateFeaturedEntry,
    getAllProductsForAdmins,
    getProductById,
} from '../controllers/product.controller';
import { upload } from '../middleware/multer.middleware';
import adminAuth from '../middleware/auth.admin.middleware';
import logger from '../utils/logger';

const router = express.Router();
router.get(
    '/featured',
    (req, res, next) => {
        logger.debug('Fetures Products');
        next();
    },
    getFeaturedProducts
);
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
    '/:productId',
    (req, res, next) => {
        logger.debug(`Updating product ${req.params.productId}`);
        next();
    },
    getProductById
);

router.get(
    '/admin/see',
    (req, res, next) => {
        logger.debug('Getting All Products');
        next();
    },
    getAllProductsForAdmins
);
router.get(
    '/',
    (req, res, next) => {
        logger.debug('Getting All Products');
        next();
    },
    getAllProducts
);

router.put(
    '/:productId/updateStock',
    (req, res, next) => {
        logger.debug(`Updating product ${req.params.productId}`);
        next();
    },
    adminAuth,
    updateStockEntry
);
router.put(
    '/:productId/updateFeatured',
    (req, res, next) => {
        logger.debug(`Updating product ${req.params.productId}`);
        next();
    },
    adminAuth,
    updateFeaturedEntry
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
