import express from 'express';
import { requireSignin, verifyRole } from "../middlewares";
import {
  becomeInstructor,
  becomeInstructor2,
  getAccountStatus,
  getCurrentInstructor,
  tempSaveBeforeClickMembership,
  updateIntructorMembershipInfo,
} from '../controllers/instructor'

const router = express.Router();

router.post('/become-instructor', requireSignin, becomeInstructor);

router.post('/become-instructor-2', requireSignin, becomeInstructor2)

router.post('/get-account-status', requireSignin, getAccountStatus);

router.get('/get-current-instructor', requireSignin, getCurrentInstructor);

router.put('/temp-save-beforeclickmembership', requireSignin, verifyRole('Instructor'), tempSaveBeforeClickMembership);

router.put('/update-membership-info', requireSignin, verifyRole('Instructor'), updateIntructorMembershipInfo);

export default router;
