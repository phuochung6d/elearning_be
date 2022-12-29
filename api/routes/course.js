import express from 'express';
import { requireSignin, isInstructor, isCurrentInstructor, verifyRole } from '../middlewares';
import formidable from 'express-formidable';
import {
  isAllowEditingCourse, // middleware
  checkUpdatingRights,  // middleware
  isChanged,  // middleware
  uploadImageController,
  removeImageController,
  removeListImageController,
  uploadPdfController,
  removePdfController,
  createCourse,
  updateCourse,
  submitPublish,
  submitUndoPublish,
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
  getAllCourses,
  getCourseInspectByAdmin,
  getDetailCourseInspectByAdmin,
  reviewNewCourseToPublish,
  reviewEditCourseToPublish,
  getAllVideoLinks,
} from '../controllers/course';

const router = express.Router();

// image
router.post('/ins/upload-image', requireSignin, uploadImageController);
router.post('/ins/remove-image', requireSignin, removeImageController);
router.post('/ins/remove-list-image', requireSignin, removeListImageController);

// file (pdf)
router.post('/ins/upload-pdf', requireSignin, uploadPdfController);
router.post('/ins/remove-pdf', requireSignin, removePdfController)

// video
router.post('/ins/upload-video/:instructorId', requireSignin, verifyRole('Instructor'), isCurrentInstructor, formidable(), uploadVideoHandler);
router.post('/ins/delete-video/:instructorId', requireSignin, verifyRole('Instructor'), isCurrentInstructor, deleteVideoHandler);

// public
router.get('/public', getPublishedCourses);
router.get('/public/:slug', getPublicCourseBySlug);
router.get('/public/id/:courseId', getPublicCourseById);

// users: instructor
// course
router.post('/ins',
  requireSignin, verifyRole('Instructor'), createCourse);
router.put('/ins/:courseId',
  requireSignin, verifyRole('Instructor'), isAllowEditingCourse, checkUpdatingRights, isChanged, updateCourse);
router.put('/ins/:courseId/submit-publish',
  requireSignin, verifyRole('Instructor'), isAllowEditingCourse, submitPublish);
router.put('/ins/:courseId/submit-undopublish',
  requireSignin, verifyRole('Instructor'), submitUndoPublish);
router.get('/ins',
  requireSignin, verifyRole('Instructor'), getInstructorCourses);
router.get('/ins/:slug',
  requireSignin, verifyRole('Instructor'), getCourseBySlug);
// section of course
router.post('/ins/:courseId/section',
  requireSignin, verifyRole('Instructor'), isCurrentInstructor, isAllowEditingCourse, addSection);
router.post('/ins/:courseId/section/:sectionId/delete',
  requireSignin, verifyRole('Instructor'), isCurrentInstructor, isAllowEditingCourse, deleteSection);
router.post('/ins/:courseId/section/:sectionId/update',
  requireSignin, verifyRole('Instructor'), isCurrentInstructor, isAllowEditingCourse, updateSection);
// lesson of course
router.post('/ins/:courseId/lesson',
  requireSignin, verifyRole('Instructor'), isCurrentInstructor, isAllowEditingCourse, addLesson);
router.put('/ins/:courseId/lesson/:lessonId/delete',
  requireSignin, verifyRole('Instructor'), isCurrentInstructor, isAllowEditingCourse, deleteLesson);
router.put('/ins/:courseId/lesson/:lessonId/update',
  requireSignin, verifyRole('Instructor'), isCurrentInstructor, isAllowEditingCourse, updateLesson);
// quiz of lesson
router.post('/ins/:courseId/lesson/:lessonId/quiz',
  requireSignin, verifyRole('Instructor'), isCurrentInstructor, isAllowEditingCourse, addQuiz);
router.put('/ins/:courseId/lesson/:lessonId/quiz/:quizId/delete',
  requireSignin, verifyRole('Instructor'), isCurrentInstructor, isAllowEditingCourse, deleteQuiz);
router.put('/ins/:courseId/lesson/:lessonId/quiz/:quizId/update',
  requireSignin, verifyRole('Instructor'), isCurrentInstructor, isAllowEditingCourse, updateQuiz);

// users: admin
router.get('/ad',
  requireSignin, verifyRole('Admin'), getAllCourses);
router.get('/ad/course-inspect',
  requireSignin, verifyRole('Admin'), getCourseInspectByAdmin);
router.get('/ad/course-inspect/:courseId',
  requireSignin, verifyRole('Admin'), getDetailCourseInspectByAdmin);
router.put('/ad/course-new/:courseId',
  requireSignin, verifyRole('Admin'), reviewNewCourseToPublish);
router.put('/ad/course-edit/:courseId',
  requireSignin, verifyRole('Admin'), reviewEditCourseToPublish);

// test
router.get('/video-links',
  getAllVideoLinks);

export default router;