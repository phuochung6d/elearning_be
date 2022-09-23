import express from 'express';
import { register as registerController } from '../controllers/auth';
import { login as loginController } from '../controllers/auth';
import { logout as logoutController } from '../controllers/auth';
import { getCurrentUser as currentUser } from '../controllers/auth';
import { requireSignin } from '../middlewares';

const router = express.Router();

router.post('/register', registerController);

router.post('/login', loginController);

router.get('/logout', logoutController);

router.get('/current-user', requireSignin, currentUser);

export default router;