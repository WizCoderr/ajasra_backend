import express from 'express';
import { addWishlistItem, getWishlistItems, deleteWishlistItem } from '../controllers/wiishlist.controller';
import auth from '../middleware/auth.middleware';
import logger from '../utils/logger';

const router = express.Router();
router.post(
    '/:userId/:productId',
    (req, res, next) => {
        logger.debug(`Adding product ${req.params.productId} to wishlist for user ${req.params.userId}`);
        next();
    },
    auth,
    addWishlistItem
);

router.get(
    '/:userId',
    (req, res, next) => {
        logger.debug(`Getting wishlist items for user ${req.params.userId}`);
        next();
    },
    auth,
    getWishlistItems
);


router.delete(
    '/:userId/:productId',
    (req, res, next) => {
        logger.debug(`Deleting product ${req.params.productId} from wishlist for user ${req.params.userId}`);
        next();
    },
    auth,
    deleteWishlistItem
);

export default router;