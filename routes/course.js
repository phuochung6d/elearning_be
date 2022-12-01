import express from 'express';
import { requireSignin, isInstructor, isCurrentInstructor } from '../middlewares';
import formidable from 'express-formidable';
import {
  uploadImageController,
  removeImageController,
  createCourse,
  updateCourse,
  getInstructorCourses,
  getPublishedCourses,
  getCourseBySlug,
  getPublicCourseBySlug,
  getPublicCourseById,
  uploadVideoHandler,
  deleteVideoHandler,
  addSection,
  deleteSection,
  updateSection,
  addLesson,
  deleteLesson,
  updateLesson,
  addQuiz,
  deleteQuiz,
  updateQuiz,
} from '../controllers/course';

const router = express.Router();

// image
router.post('/ins/upload-image', requireSignin, uploadImageController);
router.post('/ins/remove-image', requireSignin, removeImageController);

// public
router.get('/public', getPublishedCourses);
router.get('/public/:slug', getPublicCourseBySlug);
router.get('/public/id/:courseId', getPublicCourseById);

// instructor course operation
// course
router.post('/ins', requireSignin, isInstructor, createCourse);
router.put('/ins/:courseId', requireSignin, isInstructor, updateCourse);
router.get('/ins', requireSignin, isInstructor, getInstructorCourses);
router.get('/ins/:slug', requireSignin, isInstructor, getCourseBySlug);
// section of course
router.post('/ins/:courseId/section', requireSignin, isInstructor, isCurrentInstructor, addSection);
router.post('/ins/:courseId/section/:sectionId/delete', requireSignin, isInstructor, isCurrentInstructor, deleteSection);
router.post('/ins/:courseId/section/:sectionId/update', requireSignin, isInstructor, isCurrentInstructor, updateSection);
// lesson of course
router.post('/ins/:courseId/lesson', requireSignin, isInstructor, isCurrentInstructor, addLesson);
router.put('/ins/:courseId/lesson/:lessonId/delete', requireSignin, isInstructor, isCurrentInstructor, deleteLesson);
router.put('/ins/:courseId/lesson/:lessonId/update', requireSignin, isInstructor, isCurrentInstructor, updateLesson);
// quiz of lesson
router.post('/ins/:courseId/lesson/:lessonId/quiz', requireSignin, isInstructor, isCurrentInstructor, addQuiz);
router.put('/ins/:courseId/lesson/:lessonId/quiz/:quizId/delete', requireSignin, isInstructor, isCurrentInstructor, deleteQuiz);
router.put('/ins/:courseId/lesson/:lessonId/quiz/:quizId/update', requireSignin, isInstructor, isCurrentInstructor, updateQuiz);
// video
router.post('/ins/upload-video/:instructorId', requireSignin, isInstructor, isCurrentInstructor, formidable(), uploadVideoHandler);
router.post('/ins/delete-video/:instructorId', requireSignin, isInstructor, isCurrentInstructor, deleteVideoHandler);

export default router;