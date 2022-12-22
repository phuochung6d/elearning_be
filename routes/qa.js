import express from 'express';
import { requireSignin, verifyRole, isInstructor, isCurrentInstructor } from '../middlewares';
import {
  getQAs,
  getQAByIdOfLesson,
  addQA,
  updateQA,
  deleteQA,
  getQAReplies,
  getAllQAs,
} from '../controllers/qa';

const router = express.Router();

// all routes of Q&A is protected (require signed in)

// qa
router.get('/course/:courseId', requireSignin, getQAs);
router.get('/course/:courseId/lesson/:lessonId/:qaId', requireSignin, getQAByIdOfLesson);

// qa reply
router.get('/course/:courseId/qa/:qaId', requireSignin, getQAReplies);

// qa, qa reply
router.post('/course/:courseId/lesson/:lessonId', requireSignin, addQA);
router.put('/course/:courseId/lesson/:lessonId/:qaId/update', requireSignin, updateQA);
router.put('/course/:courseId/lesson/:lessonId/:qaId/delete', requireSignin, deleteQA);

// admin: statistic
router.get('/ad', requireSignin, verifyRole('Admin'), getAllQAs);

export default router;