import express from 'express';
import {
  requireSignin,
  isInstructor,
  isCurrentInstructor,
  isEnrolled,
} from '../middlewares';
import {
  freeEnrollmentController,
  paidEnrollmentController,
  checkEnrollment,
  stripeSuccessRequest,
  getEnrolledCourses,
  getEnrolledCourseBySlug,
  markLessonCompleted,
  markLessonIncompleted,
  submitQuiz,
} from '../controllers/user';

const router = express.Router();

// check if have enrolled
router.post('/check-enrollment/:courseId', requireSignin, checkEnrollment);

// enroll course
router.post('/enrollment/free/:courseId', requireSignin, freeEnrollmentController);
router.post('/enrollment/paid/:courseId', requireSignin, paidEnrollmentController);

// stripe success conditional redirect
router.get('/stripe-success/:courseId', requireSignin, stripeSuccessRequest);

// user enrolled courses operations
router.get('/enrolled-courses', requireSignin, getEnrolledCourses);
router.get('/enrolled-courses/:slug', requireSignin, isEnrolled, getEnrolledCourseBySlug);

// mark complete and incomplete
router.post(
  '/enrolled-courses/:courseId/lesson/:lessonId/mark-complete',
  requireSignin,
  isEnrolled,
  markLessonCompleted
);
router.post(
  '/enrolled-courses/:courseId/lesson/:lessonId/mark-incomplete',
  requireSignin,
  isEnrolled,
  markLessonIncompleted
);

// answer quiz
router.post('/quiz-answer/:courseId/:quizId', requireSignin, submitQuiz);

export default router;