import express from 'express';
import { requireSignin, verifyRole, isInstructor, isCurrentInstructor } from '../middlewares';
import {
  getPublicReview,
  getPublicReviewById,
  addReview,
  updateReview,
  deleteReview,
  getAllReviews,
} from '../controllers/review';

const router = express.Router();

// public
router.get('/public/course/:courseId', getPublicReview);
router.get('/public/course/:courseId/:reviewId', getPublicReviewById);

// user: Student
router.post('/course/:courseId', requireSignin, addReview);
router.put('/course/:courseId/:reviewId/update', requireSignin, updateReview);
router.put('/course/:courseId/:reviewId/delete', requireSignin, deleteReview);

// users: admin: statistic
router.get('/ad', requireSignin, verifyRole('Admin'), getAllReviews);

export default router;