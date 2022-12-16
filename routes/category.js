import express from 'express';
import { requireSignin, isInstructor, isCurrentInstructor, verifyRole } from '../middlewares';
import {
  getAllCategoriesByAdmin,
  getCategory,
  createCategory,
  updateCategory,
  deleteCategory,
  getAllCategoriesByInstructor,
} from '../controllers/category';

const router = express.Router();

// admin
router.get('/ad',
  requireSignin, verifyRole('Admin'), getAllCategoriesByAdmin);
router.get('/ad/:categoryId',
  requireSignin, verifyRole('Admin'), getCategory);
router.post('/ad',
  requireSignin, verifyRole('Admin'), createCategory);
router.put('/ad/:categoryId/update',
  requireSignin, verifyRole('Admin'), updateCategory);
  router.put('/ad/:categoryId/delete',
  requireSignin, verifyRole('Admin'), deleteCategory);

// instructor
router.get('/ins',
  requireSignin, verifyRole('Instructor'), getAllCategoriesByInstructor);

export default router;