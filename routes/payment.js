import express from 'express';
import { requireSignin } from "../middlewares";
import { createPayment, getvnP_IPN } from '../controllers/payment';

const router = express.Router();

// register membership
router.post('/create_payment_url', createPayment);
router.get('/vnpay_ipn', getvnP_IPN);

export default router;
