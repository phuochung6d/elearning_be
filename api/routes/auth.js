import express from 'express';
import {
  register as registerController,
  login as loginController,
  logout as logoutController,
  getCurrentUser as currentUser,
  requestResetPasswordCode,
  resetPassword,
} from '../controllers/auth';
// import { login as loginController } from '../controllers/auth';
// import { logout as logoutController } from '../controllers/auth';
// import { getCurrentUser as currentUser } from '../controllers/auth';
// import { sendResetPasswordEmail } from '../controllers/auth';
import { requireSignin } from '../middlewares';

const router = express.Router();

router.post('/register', registerController);

router.post('/login', loginController);

router.get('/logout', logoutController);

router.post('/forgot-password', requestResetPasswordCode);

router.post('/reset-password', resetPassword)

router.get('/current-user', requireSignin, currentUser);

export default router;