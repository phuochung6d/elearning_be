import aws from 'aws-sdk';
import { nanoid } from 'nanoid';
import chalk from 'chalk';

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
    // console.log(chalk.blue('image: '));
    // console.log(image);

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
  }
}

const createCourse = async (req, res) => {
  console.table(req.body);
}

export {
  uploadImageController,
  removeImageController,
  createCourse,
}