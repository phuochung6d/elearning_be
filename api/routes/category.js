import express from 'express';
import { requireSignin, isInstructor, isCurrentInstructor, verifyRole } from '../middlewares';
import {
  getAllCategoriesByAdmin,
  getCategory,
  createCategory,
  updateCategory,
  deleteCategory,
  getAllCategories,
  getCategoryDetail,
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

// public
router.get('/public',
  getAllCategories);
router.get('/public/:categorySlug',
  getCategoryDetail);

export default router;