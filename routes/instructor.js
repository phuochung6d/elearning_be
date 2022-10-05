import express from 'express';
import { requireSignin } from "../middlewares";
import {
  becomeInstructor,
  getAccountStatus,
  getCurrentInstructor,
} from '../controllers/instructor'

const router = express.Router();

router.post('/become-instructor', requireSignin, becomeInstructor);

router.post('/get-account-status', requireSignin, getAccountStatus);

router.get('/get-current-instructor', requireSignin, getCurrentInstructor);

export default router;
