import express from 'express';
import { requireSignin, isInstructor, isCurrentInstructor } from '../middlewares';
import formidable from 'express-formidable';
import {
  uploadImageController,
  removeImageController,
  createCourse,
  updateCourse,
  getInstructorCourses,
  getCourseBySlug,
  uploadVideoHandler,
  deleteVideoHandler,
  addLesson,
  deleteLesson,
  updateLesson,
} from '../controllers/course';

const router = express.Router();

//image
router.post('/upload-image', requireSignin, uploadImageController);
router.post('/remove-image', requireSignin, removeImageController);

//course
router.post('/', requireSignin, isInstructor, createCourse);
router.put('/:courseId', requireSignin, isInstructor, updateCourse);
router.get('/instructor-courses', requireSignin, isInstructor, getInstructorCourses);
router.get('/:slug', requireSignin, isInstructor, getCourseBySlug);
router.post('/upload-video/:instructorId', requireSignin, isInstructor, isCurrentInstructor, formidable(), uploadVideoHandler);
router.post('/delete-video/:instructorId', requireSignin, isInstructor, isCurrentInstructor, deleteVideoHandler);
router.post('/:courseId/lesson', requireSignin, isInstructor, isCurrentInstructor, addLesson);
router.put('/:courseId/lesson/:lessonId/delete', requireSignin, isInstructor, isCurrentInstructor, deleteLesson);
router.put('/:courseId/lesson/:lessonId/update', requireSignin, isInstructor, isCurrentInstructor, updateLesson);

export default router;