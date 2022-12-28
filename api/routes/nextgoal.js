import express from 'express';
import authRouter from './auth';
import instructorRouter from './instructor';
import userRouter from './user';
import courseRouter from './course';
import reviewRouter from './review';
import qaRouter from './qa';
import categoryRouter from './category';
import bannerRouter from './banner';
import paymentRouter from './payment';

const router = express.Router();

// authRouter
router.use('/auth', authRouter);

// instructorRouter router
router.use('/instructor', instructorRouter);

// userRouter router
router.use('/user', userRouter);

// courseRouter router
router.use('/course', courseRouter);

// reviewRouter router
router.use('/review', reviewRouter);

// qaRouter router
router.use('/qa', qaRouter);

// categoryRouter router
router.use('/category', categoryRouter);

// bannerRouter router
router.use('/banner', bannerRouter);

// paymentRouter router
router.use('/payment', paymentRouter);

export default router;