import express from 'express';
import { requireSignin } from "../middlewares";
import {
  becomeInstructor,
  becomeInstructor2,
  getAccountStatus,
  getCurrentInstructor,
} from '../controllers/instructor'

const router = express.Router();

router.post('/become-instructor', requireSignin, becomeInstructor);

router.post('/become-instructor-2', requireSignin, becomeInstructor2)

router.post('/get-account-status', requireSignin, getAccountStatus);

router.get('/get-current-instructor', requireSignin, getCurrentInstructor);

export default router;
