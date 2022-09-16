import express from 'express';
import { register as registerController } from '../controllers/auth';
import { login as loginController } from '../controllers/auth';

const router = express.Router();

router.post('/register', registerController);

router.post('/login', loginController);

export default router;