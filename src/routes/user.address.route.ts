import express from 'express';
import { addUserAddress } from '../controllers/user.address.controller';
import { validate } from '../middleware/validation.middleware';
import { addressSchema } from '../middleware/validation.middleware';
import auth from '../middleware/auth.middleware';
import logger from '../utils/logger';

const router = express.Router();

router.post(
    '/:userId',
    auth,
    validate(addressSchema),
    (req, res, next) => {
        logger.info(`Adding address for user: ${req.user?.id}`);
        next();
    },
    addUserAddress
);

export default router;