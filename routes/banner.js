import express from 'express';
import { requireSignin, verifyRole } from '../middlewares';
import {
  uploadImageController,
  removeImageController,
  getAllBanners,
  getBannerDetail,
  createBanner,
  updateBanner,
  deleteBanner,
} from '../controllers/banner';

const router = express.Router();

//client
router.get('/public', getAllBanners);
router.get('/public/:bannerId', getBannerDetail);

// admin
// image
router.post('/ad/upload-image', requireSignin, verifyRole('Admin'), uploadImageController);
router.post('/ad/remove-image', requireSignin, verifyRole('Admin'), removeImageController);

// operation
router.post('/ad', requireSignin, verifyRole('Admin'), createBanner);
router.put('/ad/:bannerId/update', requireSignin, verifyRole('Admin'), updateBanner);
router.put('/ad/:bannerId/delete', requireSignin, verifyRole('Admin'), deleteBanner);

export default router;