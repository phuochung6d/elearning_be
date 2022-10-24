import aws from 'aws-sdk';
import { nanoid } from 'nanoid';
import chalk from 'chalk';
import Course from '../models/course';
import slugify from 'slugify';
import { readFileSync } from "fs";

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
    return res.status(400).json({
      success: false,
      message: 'Delete image fail, try again!',
      data: null
    });
  }
}

const createCourse = async (req, res) => {
  console.table(req.body);
  try {
    const alreadyExist = await Course.findOne({
      slug: slugify(req.body.name.toLowerCase())
    });
    if (alreadyExist)
      return res.status(409).json({
        success: false,
        message: 'Name of course is already taken in ous system',
        data: null
      });

    const newCourse = new Course({
      slug: slugify(req.body.name),
      instructor: req.user._id,
      ...req.body
    })

    await newCourse.save();

    return res.status(201).json({
      success: true,
      message: 'Course created',
      data: newCourse
    })
  }
  catch (error) {
    console.log(chalk.red('error: '));
    console.log(error);
    return res.status(400).json({
      success: false,
      message: 'Create course fail, try again!',
      data: null
    });
  }
}

const getInstructorCourses = async (req, res) => {
  try {
    const instructorCourses = await Course.find({ instructor: req.user._id });

    return res.status(200).json({
      success: true,
      message: 'Get courses of instructor successfully',
      data: instructorCourses
    })
  }
  catch (error) {
    console.log(chalk.red('error: '));
    console.log(error);
    return res.status(400).json({
      success: false,
      message: 'Get course fail',
      data: null
    })
  }
}

const getPublishedCourses = async (req, res) => {
  try {
    const filters = {};
    filters['published'] = true;
    if (req.query.paid) filters['paid'] = req.query.paid === 'true';
    if (req.query.category) filters['category'] = req.query.category;
    const courses = await Course
      .find(filters)
      .select('category summary goal requirements languages description name paid price slug image lessons updatedAt')
      .populate({ path: 'instructor', select: 'name' });

    console.log(courses);

    return res.status(200).json({
      success: true,
      message: 'Get public course successfully',
      data: courses
    })
  }
  catch (error) {
    console.log(chalk.red('error: '));
    console.log(error);
    return res.status(400).json({
      success: false,
      message: 'Get course fail',
      data: null
    })
  }
}

const getCourseBySlug = async (req, res) => {
  try {
    const course = await Course.findOne({ slug: req.params.slug }).populate({ path: 'instructor', select: 'name role' });
    if (!course)
      return res.status(204).json({
        success: false,
        message: 'No course found',
        data: null
      });

    return res.status(200).json({
      success: true,
      message: 'Get course successfully',
      data: course
    })
  }
  catch (error) {
    console.log(chalk.red('error: '));
    console.log(error);
    return res.status(400).json({
      success: false,
      message: 'Get course fail, try again!',
      data: null
    })
  }
}

const getPublicCourseBySlug = async (req, res) => {
  try {
    const course = await Course
      .findOne({ slug: req.params.slug })
      .populate({ path: 'instructor', select: 'name role' })
      .select('name summary goal requirements languages slug description image category price paid updatedAt lessons');
    if (!course)
      return res.status(204).json({
        success: false,
        message: 'No course found',
        data: null
      });

    return res.status(200).json({
      success: true,
      message: 'Get course successfully',
      data: course
    })
  }
  catch (error) {
    console.log(chalk.red('error: '));
    console.log(error);
    return res.status(400).json({
      success: false,
      message: 'Get course fail, try again!',
      data: null
    })
  }
}

const uploadVideoHandler = async (req, res) => {
  const { video } = req.files;

  // prepare params for uploading video to s3
  const params = {
    Bucket: 'nextgoal-bucket',
    Key: `${nanoid()}.${video.type.split('/')[1]}`,
    Body: readFileSync(video.path),
    ACL: 'public-read',
    ContentType: video.type
  }

  //upload to s3
  s3.upload(params, (error, data) => {
    if (error) {
      console.log(chalk.red('error: '));
      console.log(error);
      return res.status(400).json({
        success: false,
        message: error.message,
        data: null
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Upload video successfully',
      data
    })
  })
}

const deleteVideoHandler = async (req, res) => {
  try {
    const { video_link } = req.body;
    console.log('video_link: ', video_link);

    // prepare video params
    const videoParams = {
      Bucket: video_link.Bucket,
      Key: video_link.Key,
    };

    // delete from s3
    s3.deleteObject(videoParams, (error, data) => {
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
    console.log(chalk.red('error: '));
    console.log(error);
    return res.status(400).json({
      success: false,
      message: 'Delete video fail, try again!',
      data: null
    })
  }
}

const addLesson = async (req, res) => {
  try {
    const { title, content, video_link, free_preview, duration } = req.body;
    const { courseId } = req.params;

    const updated = await Course.findOneAndUpdate(
      { _id: courseId },
      {
        $push: {
          lessons: { title, content, video_link, free_preview, duration, slug: slugify(title) }
        }
      },
      { new: true }
    ).populate({ path: 'instructor', select: '_id name' });

    return res.status(201).json({
      success: true,
      message: 'Add lesson to course successfully',
      data: updated
    });
  }
  catch (error) {
    console.log(chalk.red('error: '));
    console.log(error);
    return res.status(400).json({
      success: false,
      message: 'Get course fail, try again!',
      data: null
    })
  }
}

const updateCourse = async (req, res) => {
  try {
    const { courseId } = req.params;

    console.log(chalk.blue('req.body'));
    console.log(req.body);


    const value = {};
    ['name', 'summary', 'slug', 'image', 'description', 'category', 'price', 'published', 'requirements', 'goal', 'languages']
      .forEach(item => {
        if (Object.keys(req.body).includes(item))
          value[`${item}`] = req.body[`${item}`];
      });

    const updated = await Course.findOneAndUpdate(
      { _id: courseId },
      value,
      { new: true }
    );
    if (!updated)
      return res.status(204).json({
        success: false,
        message: 'No course found with this slug',
        data: null
      });

    return res.status(200).json({
      success: true,
      message: 'Update course successfully',
      data: updated
    })

  }
  catch (error) {
    console.log(chalk.red('error: '));
    console.log(error);
    return res.status(400).json({
      success: false,
      message: 'Get course fail, try again!',
      data: null
    })
  }
}

const deleteLesson = async (req, res) => {
  try {
    const { courseId, lessonId } = req.params;

    let course = await Course.findByIdAndUpdate(
      courseId,
      {
        $pull: {
          lessons: { _id: lessonId }
        }
      }
    );
    if (!course)
      return res.status(400).json({
        success: false,
        message: 'Not found lesson or course, try again!',
        data: null
      });

    return res.status(200).json({
      success: true,
      message: 'Delete lesson from course successfully!',
      data: null
    })
  }
  catch (error) {
    console.log(chalk.red('error: '));
    console.log(error);
    return res.status(400).json({
      success: false,
      message: 'Delete lesson fail, try again!',
      data: null
    })
  }
}

const updateLesson = async (req, res) => {
  try {
    const { courseId, lessonId } = req.params;
    const { title, content, duration, video_link, free_preview } = req.body.lesson;
    console.log(req.body);

    const updated = await Course.updateOne(
      { "lessons._id": lessonId },
      {
        $set: {
          "lessons.$.title": title,
          "lessons.$.slug": slugify(title),
          "lessons.$.content": content,
          "lessons.$.duration": duration,
          "lessons.$.video_link": video_link,
          "lessons.$.free_preview": free_preview,
        }
      }
    );

    if (!updated)
      return res.status(400).json({
        success: false,
        message: 'No lesson found',
        data: null
      });

    return res.status(200).json({
      success: true,
      message: 'Update lesson successfully',
      data: updated
    })
  }
  catch (error) {
    console.log(chalk.red('error: '));
    console.log(error);
    return res.status(400).json({
      success: false,
      message: 'Delete lesson fail, try again!',
      data: null
    })
  }
}

export {
  uploadImageController,
  removeImageController,
  createCourse,
  getInstructorCourses,
  getPublishedCourses,
  getCourseBySlug,
  getPublicCourseBySlug,
  uploadVideoHandler,
  deleteVideoHandler,
  addLesson,
  updateCourse,
  deleteLesson,
  updateLesson,
}