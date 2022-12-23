import express from 'express';
import { requireSignin, verifyRole } from "../middlewares";
import { checkIsPayForMembership, createPayment, getvnP_IPN } from '../controllers/payment';

const router = express.Router();

// register membership
router.post('/create_payment_url', requireSignin, verifyRole('Instructor'), checkIsPayForMembership, createPayment);
router.get('/vnpay_ipn', requireSignin, getvnP_IPN);

export default router;
