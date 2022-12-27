import { nanoid } from 'nanoid';
import Banner from '../models/banner';
import chalk from 'chalk';
import aws from 'aws-sdk';
import lodash from 'lodash';
import dayjs from 'dayjs';

const awsConfig = {
  accessKeyId: process.env.AWS_IAM_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_IAM_SECRET_ACCESS_KEY,
  region: process.env.AWS_IAM_REGION,
  apiVersion: process.env.AWS_IAM_SES_API_VERSION
}

const s3 = new aws.S3(awsConfig);

const uploadImageController = async (req, res) => {
  try {
    const { image } = req.body;

    if (!image)
      res.status(400).json({
        success: false,
        message: 'No image found',
        data: image
      });

    // prepare image
    const [base64Data, imgType] = [
      new Buffer.from(
        image.replace(/^data:(.*,)?/, ""),
        'base64'),
      image.split(';')[0].split('/')[1]
    ];

    // declare params to S3 upload
    const imageUploadParams = {
      Bucket: 'nextgoal-bucket',
      Key: `${nanoid()}.${imgType}`,
      Body: base64Data,
      ACL: 'public-read',
      ContentEncoding: 'base64',
      ContentType: `image/${imgType}`,
    }

    // upload
    s3.upload(
      imageUploadParams,
      (error, data) => {
        if (error)
          return res.status(400).json({
            success: false,
            message: error,
            data: null
          });

        return res.status(200).json({
          success: true,
          message: 'Upload success',
          data
        });
      }
    );
  }
  catch (error) {
    console.log(chalk.red('errrror: '));
    console.log(error);
    return res.status(400).json({
      success: false,
      message: 'Upload image fail, try again!',
      data: null
    });
  }
}

const removeImageController = async (req, res) => {
  try {
    const { image } = req.body;

    // params to s3 bucket
    const imageParams = {
      Bucket: image.Bucket,
      Key: image.Key
    }

    //delete
    s3.deleteObject(imageParams, (error, data) => {
      if (error)
        return res.status(400).json({
          success: false,
          message: error,
          data: null
        });

      return res.status(200).json({
        success: true,
        message: 'Remove success',
        data
      });
    });
  }
  catch (error) {
    console.log(chalk.red('errrror: '));
    console.log(error);
    return res.status(400).json({
      success: false,
      message: 'Delete image fail, try again!',
      data: null
    });
  }
}

const getAllBanners = async (req, res) => {
  try {
    const { type, categoryId, salePosition } = req.query;

    let filters = {};
    if (type) filters['type'] = type;
    if (type === 'category') {
      if (categoryId) filters['categoryId'] = categoryId;
    } else if (type === 'sale') {
      if (salePosition) filters['salePosition'] = salePosition;
    };

    const banners = await Banner.aggregate([
      {
        $match: filters
      }
    ]);

    return res.status(200).json({
      success: true,
      message: 'Get all banners successfully',
      data: banners
    })
  }
  catch (error) {
    console.log(chalk.red('errrror: '));
    console.log(error);
    return res.status(400).json({
      success: false,
      message: 'Get all banners fail, try again!',
      data: null
    });
  }
}

const getBannerDetail = async (req, res) => {
  try {
    const { bannerId } = req.params;

    const [banner] = await Banner.aggregate([
      {
        $match: {
          _id: bannerId
        }
      },
      {
        $limit: 1
      }
    ]);

    return res.status(200).json({
      success: true,
      message: 'Get detail banner successfully',
      data: banner
    })
  }
  catch (error) {
    console.log(chalk.red('errrror: '));
    console.log(error);
    return res.status(400).json({
      success: false,
      message: 'Get detail of banner fail, try again!',
      data: null
    });
  }
}

const createBanner = async (req, res) => {
  try {
    const { type, categoryId, image, salePosition } = req.body.banner;

    let data = {};
    if (type) data['type'] = type;
    if (image) data['image'] = image;
    if (type === 'category') {
      data['categoryId'] = categoryId;
    } else if (type === 'sale') {
      data['salePosition'] = salePosition;
    }

    const banner = new Banner(data);

    await banner.save();

    return res.status(201).json({
      success: true,
      message: 'Create banner successfully',
      data: banner,
    })
  }
  catch (error) {
    console.log(chalk.red('errrror: '));
    console.log(error);
    return res.status(400).json({
      success: false,
      message: 'Create banner fail, try again!',
      data: null
    });
  }
}

const updateBanner = async (req, res) => {
  try {
    const { bannerId } = req.params;
    const { type, categoryId, image } = req.body.banner;

    let data = {};
    if (type) data['type'] = type;
    if (image) data['image'] = image;
    if (type === 'category') {
      data['categoryId'] = categoryId;
    } else if (type === 'sale') {
      data['salePosition'] = salePosition;
    }

    const banner = await Banner.findByIdAndUpdate(
      bannerId,
      data
    );

    return res.status(200).json({
      success: true,
      message: 'Update banner successfully',
      data: banner
    })
  }
  catch (error) {
    console.log(chalk.red('errrror: '));
    console.log(error);
    return res.status(400).json({
      success: false,
      message: 'Update banner fail, try again!',
      data: null
    });
  }
}

const deleteBanner = async (req, res) => {
  try {
    const { bannerId } = req.params;

    await Banner.findByIdAndDelete(bannerId);

    return res.status(200).json({
      success: true,
      message: 'Delete banner successfully',
      data: null
    });
  }
  catch (error) {
    console.log(chalk.red('errrror: '));
    console.log(error);
    return res.status(400).json({
      success: false,
      message: 'Delete banner fail, try again!',
      data: null
    });
  }
}

export {
  uploadImageController,
  removeImageController,
  getAllBanners,
  getBannerDetail,
  createBanner,
  updateBanner,
  deleteBanner,
}