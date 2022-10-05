import express from 'express';
import { requireSignin, isInstructor } from '../middlewares';
import {
  uploadImageController,
  removeImageController,
  createCourse,
} from '../controllers/course';

const router = express.Router();

//image
router.post('/upload-image', requireSignin, uploadImageController);
router.post('/remove-image', requireSignin, removeImageController);

//course
router.post('/', requireSignin, isInstructor, createCourse);

export default router;