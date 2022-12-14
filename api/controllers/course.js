import aws from 'aws-sdk';
import { nanoid } from 'nanoid';
import chalk from 'chalk';
import Course from '../models/course';
import User from '../models/user';
import slugify from 'slugify';
import { readFileSync } from "fs";
import lodash from 'lodash';
import dayjs from 'dayjs';
import { checkValidMembership } from '../../utils/checkValidMembership';
import { createNestedObject } from '../../utils/createNestedObject';

const awsConfig = {
  accessKeyId: process.env.AWS_IAM_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_IAM_SECRET_ACCESS_KEY,
  region: process.env.AWS_IAM_REGION,
  apiVersion: process.env.AWS_IAM_SES_API_VERSION
}

const s3 = new aws.S3(awsConfig);

const isAllowEditingCourse = async (req, res, next) => {
  try {
    const { courseId } = req.params;

    const course = await Course.findById(courseId);

    if (course.status === 'unaccepted')
      return res.status(400).json({
        success: false,
        message: `Can not editing course while submitting course for inspecting`,
        data: null
      });
    else
      next();
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

const checkUpdatingRights = async (req, res, next) => {
  try {
    // // const { paid, price } = req.body;
    // const { courseId } = req.params;

    // const user = await User.findById(req.user._id);
    // const [plan_type, plan_start] = [
    //   user.instructor_information.plan_type,
    //   user.instructor_information.plan_start
    // ];

    // const course = await Course.findById(courseId);
    // const [newPrice, price] = [
    //   req.body.price > 0 && req.body.paid,  // T: có phí | F: ko có phí
    //   course.price > 0 && course.paid,  // T: có phí | F: ko có phí
    // ];

    // if (price) {
    //   const checked = checkValidMembership(plan_type, plan_start);

    //   if (checked)
    //     next();
    //   else
    //     return res.status(400).json({
    //       success: false,
    //       message: `Instructor having expired membership can not update their paid courses, please re-new the membership`,
    //       data: null
    //     });
    // }
    // else {
    //   if (!newPrice)
    //     next();
    //   else {
    //     const checked = checkValidMembership(plan_type, plan_start);

    //     if (checked)
    //       next();
    //     else
    //       return res.status(400).json({
    //         success: false,
    //         message: `Please join the membership to update free course to paid course`,
    //         data: null
    //       });
    //   }
    // }
    next();
  }
  catch (error) {
    console.log(chalk.red('errrror: '));
    console.log(error);
    return res.status(400).json({
      success: false,
      message: 'Check updating rights fail, try again!',
      data: null
    });
  }
}

const isChanged = async (req, res, next) => {
  try {
    const { courseId } = req.params;

    const [course] = await Course.aggregate([
      {
        $match: { _id: courseId }
      },
      {
        $limit: 1
      }
    ]);

    let flag = false;
    Object.keys(req.body).forEach(async _ => {
      let latest = '', old = '', old_official_data = '';
      if (req.body[`${_}`]) latest = JSON.stringify(req.body[`${_}`]);
      if (course[`${_}`]) old = JSON.stringify(course[`${_}`]);
      if (course?.official_data) {
        if (course?.official_data[`${_}`]) old_official_data = JSON.stringify(course?.official_data[`${_}`]);
      }

      if (
        latest !== old_official_data
        ||
        latest !== old
      ) {
        flag = true;
        return;
      }
    });

    if (flag)
      next();
    else
      return res.status(400).json({
        success: false,
        message: `No data was changed`,
        data: null
      })
  }
  catch (error) {
    console.log(chalk.red('errrror: '));
    console.log(error);
    return res.status(400).json({
      success: false,
      message: 'Check changes of course fail, try again!',
      data: null
    });
  }
}

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
    return res.status(400).json({
      success: false,
      message: 'Upload image fail, try again!',
      data: null
    });
  }
}

const uploadPdfController = async (req, res) => {
  try {
    const { pdfFile } = req.body;

    if (!pdfFile)
      res.status(400).json({
        success: false,
        message: 'No pdf file found',
        data: pdfFile
      });

    // prepare pdf file
    const [base64Data, fileType] = [
      new Buffer.from(
        pdfFile.replace(/^data:application\/\w+;base64,/, ""),
        'base64'),
      pdfFile.split(';')[0].split('/')[1]
    ];

    // declare params to S3 upload
    const pdfFileUploadParams = {
      Bucket: 'nextgoal-bucket',
      Key: `${nanoid()}.${fileType}`,
      Body: base64Data,
      ACL: 'public-read',
      ContentEncoding: 'base64',
      ContentType: `application/pdf`,
    }

    // upload
    s3.upload(
      pdfFileUploadParams,
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
      message: 'Upload pdf fail, try again!',
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

const removePdfController = async (req, res) => {
  try {
    const { pdfFile } = req.body;

    // params to s3 bucket
    const pdfParams = {
      Bucket: pdfFile.Bucket,
      Key: pdfFile.Key
    }

    //delete
    s3.deleteObject(pdfParams, (error, data) => {
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
      message: 'Delete pdf fail, try again!',
      data: null
    });
  }
}

const removeListImageController = async (req, res) => {
  try {
    const { image } = req.body;

    image?.forEach(item => {
      // params to s3 bucket
      const imageParams = {
        Bucket: item.Bucket,
        Key: item.Key
      }

      //delete
      s3.deleteObject(imageParams, (error, data) => {
        if (error)
          return res.status(400).json({
            success: false,
            message: error,
            data: null
          });
      });
    });

    return res.status(200).json({
      success: true,
      message: 'Remove success',
      data: 'SUCCESS'
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

const getPublishedCourses = async (req, res) => {
  try {
    const filters = {};
    filters['published'] = true;
    if (req.query.category) filters['categoryInfo._id'] = req.query.category;
    if (req.query.name) filters['name'] = { $regex: req.query.name, $options: 'i' };
    if (req.query.duration) filters['courseDurationSum'] = { $gte: +req.query.duration };
    if (req.query.lowerPrice && req.query.upperPrice) {
      filters['$and'] = [
        { price: { $gte: +req.query.lowerPrice } },
        { price: { $lte: +req.query.upperPrice } },
      ];
    } else {
      if (req.query.lowerPrice) filters['price'] = { $gte: +req.query.lowerPrice };
      if (req.query.upperPrice) filters['price'] = { $lte: +req.query.upperPrice };
    }

    const sortBy = {};
    if (req.query.sortBy) {
      if (req.query.sortBy === 'star')
        sortBy[`reviewStarAvg`] = +req.query.sortByMode;
      else if (req.query.sortBy === 'duration')
        sortBy[`courseDurationSum`] = +req.query.sortByMode;
      else
        sortBy[`${req.query.sortBy}`] = +req.query.sortByMode;
    }

    let limit = 0;
    if (req.query.limit) limit = +req.query.limit; else limit = 14;
    let skip = 0;
    if (req.query.page) skip = (+req.query.page - 1) * +req.query.limit; else skip = 0;

    const courses = await Course.aggregate([
      {
        $match: {
          official_data: { $exists: true }
        }
      },
      {
        $replaceRoot: { newRoot: '$official_data' }
      },
      {
        $lookup: {
          from: 'users',
          let: { course_instructor: '$instructor' },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ['$_id', '$$course_instructor'] },
                  ]
                }
              }
            },
            {
              $project: { name: 1, instructor_information: 1 }
            }
          ],
          as: 'instructorInfo'
        }
      },
      {
        $lookup: {
          from: 'categories',
          let: { course_category: '$category' },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ['$_id', '$$course_category'] }
                  ]
                }
              }
            }
          ],
          as: 'categoryInfo'
        }
      },
      {
        $lookup: {
          from: 'reviews',
          let: { course_id: '$_id' },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ['$courseId', '$$course_id'] }
                  ]
                }
              }
            }
          ],
          as: 'reviewList'
        }
      },
      {
        $addFields: {
          reviewStars: '$reviewList.star',
          courseDuration: '$lessons.duration',
        }
      },
      {
        $set: {
          instructor: { $first: '$instructorInfo' },
          categoryInfo: { $first: '$categoryInfo' },
          reviewStarAvg: { $trunc: [{ $avg: '$reviewStars' }, 1] },
          courseDurationSum: { $sum: '$courseDuration' }
        }
      },
      {
        $project: {
          reviewStars: 0, instructorInfo: 0, courseDuration: 0,
        }
      },
      {
        $match: filters
      },
      {
        $sort: {
          ...sortBy,
          updateAt: -1
        }
      },
      {
        $facet: {
          paginatedResults: [{ $skip: skip }, { $limit: limit }],
          totalCount: [
            {
              $count: 'count'
            }
          ]
        }
      }
    ]);

    let _courses = JSON.parse(JSON.stringify(courses));
    courses[0]?.paginatedResults?.forEach((course, index_course) => {
      course?.lessons?.forEach((lesson, index_lesson) => {
        const found = course?.sections?.find(section => section._id === lesson.section);
        _courses[0].paginatedResults[index_course].lessons[index_lesson].section = found ? found : lesson?.section
      })
    })

    return res.status(200).json({
      success: true,
      message: 'Get public course successfully',
      data: _courses
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

const getPublicCourseBySlug = async (req, res) => {
  if (!req.query.date)
    req.query.data = Date.now();

  try {
    const filters = {};
    filters['official_data.published'] = true;
    // filters['official_data.status'] = 'public';
    if (req.params.slug) filters['official_data.slug'] = req.params.slug;

    const [course] = await Course.aggregate([
      {
        $match: filters
      },
      {
        $replaceRoot: { newRoot: '$official_data' }
      },
      {
        $lookup: {
          from: 'users',
          let: { course_instructor: '$instructor' },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ['$_id', '$$course_instructor'] }
                  ]
                }
              }
            },
            {
              $project: { name: 1, role: 1, instructor_information: 1 }
            }
          ],
          as: 'instructorInfo'
        }
      },
      {
        $lookup: {
          from: 'categories',
          let: { course_category: '$category' },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ['$_id', '$$course_category'] }
                  ]
                }
              }
            }
          ],
          as: 'categoryInfo'
        }
      },
      {
        $set: {
          instructorInfo: { $first: '$instructorInfo' },
          categoryInfo: { $first: '$categoryInfo' }
        }
      },
      {
        $limit: 1
      }
    ]);

    if (!course)
      return res.status(204).json({
        success: false,
        message: `No course found. Time: ${req.query.date}`,
        data: null
      });

    const _course = JSON.parse(JSON.stringify(course));
    course?.lessons?.forEach((lesson, index) => {
      const found = course.sections.find(section => section?._id === lesson?.section);
      _course.lessons[index].section = found ? found : lesson?.section
    });

    return res.status(200).json({
      success: true,
      message: `Get course successfully. Time: ${req.query.date}`,
      data: _course
    })
  }
  catch (error) {
    console.log(chalk.red('error: '));
    console.log(error);
    return res.status(400).json({
      success: false,
      message: `Get course fail, try again! Time: ${req.query.date}`,
      data: null
    })
  }
}

const getPublicCourseById = async (req, res) => {
  try {
    const filters = {};
    filters['official_data.published'] = true;
    // filters['official_data.status'] = 'public';
    if (req.params.courseId) filters['official_data._id'] = req.params.courseId;

    const [course] = await Course.aggregate([
      {
        $match: filters
      },
      {
        $replaceRoot: { newRoot: '$official_data' }
      },
      {
        $lookup: {
          from: 'users',
          let: { course_instructor: '$instructor' },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ['$_id', '$$course_instructor'] }
                  ]
                }
              }
            },
            {
              $project: { name: 1, role: 1, instructor_information: 1 }
            }
          ],
          as: 'instructorInfo'
        }
      },
      {
        $lookup: {
          from: 'categories',
          let: { course_category: '$category' },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ['$_id', '$$course_category'] }
                  ]
                }
              }
            }
          ],
          as: 'categoryInfo'
        }
      },
      {
        $set: {
          instructor: { $first: '$instructorInfo' },
          categoryInfo: { $first: '$categoryInfo' }
        }
      },
      // {
      //   $limit: 1
      // }
    ]);

    console.log(course[0]?.name);

    if (!course)
      return res.status(400).json({
        success: false,
        message: 'No course found with this id',
        data: null
      });

    const _course = JSON.parse(JSON.stringify(course));
    course?.lessons?.forEach((lesson, index) => {
      const found = course.sections.find(section => section?._id === lesson?.section);
      _course.lessons[index].section = found ? found : lesson?.section
    });

    return res.status(200).json({
      success: true,
      message: 'Get course by id successfully',
      data: _course
    })
  }
  catch (error) {
    console.log(chalk.red('error: '));
    console.log(error);
    return res.status(400).json({
      success: false,
      message: `Get course fail, try again! Time: ${req.query.date}`,
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

const createCourse = async (req, res) => {
  try {
    if (!req.body.name)
      return res.status(400).json({
        success: false,
        message: 'Please fill complelely information of course',
        data: null
      })

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
      status: 'unpublic',
      published: false,
      official_data: {},
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

const updateCourse = async (req, res) => {
  try {
    const { courseId } = req.params;

    const course = await Course.findById(courseId);

    let value = {}, flag = false;
    ['name', 'summary', 'image', 'description', 'category', 'tags', 'paid', 'price', 'requirements', 'goal', 'languages']
      .forEach(item => {
        if (Object.keys(req.body).includes(item)) {
          value[`${item}`] = req.body[`${item}`];
          if (course?.official_data) {
            if (JSON.stringify(req.body[`${item}`]) !== JSON.stringify(course.official_data[`${item}`]))
              flag = true;
          }
        }
      });

    const updated = await Course.findOneAndUpdate(
      { _id: courseId },
      {
        ...value,
        slug: slugify(req.body.name),
        status: !course.official_data
          ? 'unpublic'
          : flag
            ? 'unpublic'
            : 'public',
      },
      { new: true }
    );

    const _updated = JSON.parse(JSON.stringify(updated));
    updated?.lessons?.forEach((lesson, index) => {
      const found = updated?.sections?.find(section => section?._id === lesson?.section);
      _updated.lessons[index].section = found ? found : lesson?.section
    });

    return res.status(200).json({
      success: true,
      message: 'Update course successfully',
      data: _updated
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

const submitPublish = async (req, res) => {
  try {
    const { courseId } = req.params;

    const updated = await Course.findByIdAndUpdate(
      courseId,
      {
        status: 'unaccepted'
      },
      { new: true }
    );

    const _updated = JSON.parse(JSON.stringify(updated));
    updated?.lessons?.forEach((lesson, index) => {
      const found = updated?.sections?.find(section => section?._id === lesson?.section);
      _updated.lessons[index].section = found ? found : lesson?.section
    });

    return res.status(200).json({
      success: true,
      message: 'Submit publish for this course successfully',
      data: _updated
    });
  }
  catch (error) {
    console.log(chalk.red('error: '));
    console.log(error);
    return res.status(400).json({
      success: false,
      message: 'Submit publish course fail',
      data: null
    })
  }
}

const submitUndoPublish = async (req, res) => {
  try {
    const { courseId } = req.params;

    const updated = await Course.findByIdAndUpdate(
      courseId,
      {
        status: 'unpublic'
      },
      { new: true }
    );

    const _updated = JSON.parse(JSON.stringify(updated));
    updated?.lessons?.forEach((lesson, index) => {
      const found = updated?.sections?.find(section => section?._id === lesson?.section);
      _updated.lessons[index].section = found ? found : lesson?.section
    });

    return res.status(200).json({
      success: true,
      message: 'Submit undo publish for this course successfully',
      data: _updated
    });
  }
  catch (error) {
    console.log(chalk.red('error: '));
    console.log(error);
    return res.status(400).json({
      success: false,
      message: 'Submit undo publish course fail',
      data: null
    })
  }
}

const getInstructorCourses = async (req, res) => {
  try {
    console.log('query: ', req.query);

    const filters = {};
    filters['instructor'] = req.user._id;
    if (req.query.published) filters['published'] = req.query.published === 'true';
    if (req.query.status) filters['status'] = req.query.status;
    if (req.query.name) filters['name'] = { $regex: req.query.name, $options: 'i' };

    let limit = 0;
    if (req.query.limit) limit = +req.query.limit;
    let skip = 0;
    if (req.query.page) skip = (+req.query.page - 1) * +req.query.limit;

    const instructorCourses = await Course.aggregate([
      {
        $match: filters
      },
      {
        $lookup: {
          from: 'users',
          let: { course_instructor: '$instructor' },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ['$_id', '$course_instructor'] }
                  ]
                }
              }
            },
            {
              $project: { password: 0, passwordResetCode: 0 }
            }
          ],
          as: 'instructorInfo'
        }
      },
      {
        $lookup: {
          from: 'categories',
          let: { course_category: '$category' },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ['$_id', '$$course_category'] },
                  ]
                }
              }
            },
            {
              $project: { name: 1 }
            }
          ],
          as: 'categoryInfo'
        }
      },
      {
        $lookup: {
          from: 'categories',
          let: { course_official_data_category: '$official_data.category' },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ['$_id', '$$course_official_data_category'] }
                  ]
                }
              }
            }
          ],
          as: 'official_data.categoryInfo'
        }
      },
      {
        $set: {
          instructorInfo: { $first: '$instructorInfo' },
          categoryInfo: { $first: '$categoryInfo' },
          'official_data.categoryInfo': { $first: '$official_data.categoryInfo' }
        }
      },
      {
        $sort: {
          updatedAt: -1
        }
      },
      {
        $facet: {
          paginatedResults: [{ $skip: skip }, { $limit: limit }],
          totalCount: [
            {
              $count: 'count'
            }
          ]
        }
      }
    ]);

    let _instructorCourses = JSON.parse(JSON.stringify(instructorCourses));
    instructorCourses[0]?.paginatedResults.forEach((course, index_course) => {
      course?.lessons?.forEach((lesson, index_lesson) => {
        const found = course?.sections?.find(section => section._id === lesson.section);
        _instructorCourses[0].paginatedResults[index_course].lessons[index_lesson].section = found ? found : lesson?.section
      })
    })

    return res.status(200).json({
      success: true,
      message: 'Get courses of instructor successfully',
      data: _instructorCourses
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
    // const course = await Course
    //   .findOne({ slug: req.params.slug })
    //   .populate({ path: 'instructor', select: 'name role' });

    const [course] = await Course.aggregate([
      {
        $match: {
          slug: req.params.slug,
          instructor: req.user._id,
        }
      },
      {
        $lookup: {
          from: 'users',
          let: { course_instructor: '$instructor' },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ['$_id', '$$course_instructor'] }
                  ]
                }
              }
            }
          ],
          as: 'instructorInfo'
        }
      },
      {
        $lookup: {
          from: 'categories',
          let: { course_category: '$category' },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ['$_id', '$$course_category'] }
                  ]
                }
              }
            }
          ],
          as: 'categoryInfo'
        }
      },
      {
        $lookup: {
          from: 'categories',
          let: { course_official_data_category: '$official_data.category' },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ['$_id', '$$course_official_data_category'] }
                  ]
                }
              }
            }
          ],
          as: 'official_data.categoryInfo'
        }
      },
      {
        $set: {
          instructorInfo: { $first: '$instructorInfo' },
          categoryInfo: { $first: '$categoryInfo' },
          'official_data.categoryInfo': { $first: '$official_data.categoryInfo' }
        }
      },
      {
        $limit: 1
      }
    ])

    const _course = lodash.cloneDeep(course);
    course?.lessons?.forEach((lesson, index) => {
      const found = course.sections.find(section => section?._id === lesson?.section);
      _course.lessons[index].section = found ? found : lesson?.section
    });

    if (!course)
      return res.status(204).json({
        success: false,
        message: 'No course found',
        data: null
      });

    return res.status(200).json({
      success: true,
      message: 'Get course successfully',
      data: _course
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

const addSection = async (req, res) => {
  try {
    const { courseId } = req.params;
    const { index, name } = req.body;

    const duplicated = await Course.findOne({
      _id: courseId,
      sections: {
        $elemMatch: {
          index
        }
      }
    });

    if (duplicated)
      return res.status(400).json({
        success: false,
        message: 'Exist current section index in this course',
        data: null
      });

    const updatedCourse = await Course.findByIdAndUpdate(
      courseId,
      {
        $addToSet: {
          sections: {
            index,
            name
          }
        },
        status: 'unpublic'
      },
      { new: true }
    );

    const _updatedCourse = JSON.parse(JSON.stringify(updatedCourse));
    updatedCourse.lessons.forEach((lesson, index) => {
      const found = updatedCourse.sections.find(section => section._id === lesson.section);
      _updatedCourse.lessons[index].section = found ? found : lesson.section;
    })

    return res.status(201).json({
      success: true,
      message: 'Add section successfully',
      data: _updatedCourse
    })
  }
  catch (error) {
    console.log(chalk.red('error: '));
    console.log(error);
    return res.status(400).json({
      success: false,
      message: 'Add section fail, try again!',
      data: null
    })
  }
}

const deleteSection = async (req, res) => {
  try {
    const { courseId, sectionId } = req.params;

    console.log('sectionId: ', sectionId);

    const check = await Course.findOne({
      _id: courseId,
      'lessons.section': sectionId
    });

    // check if that section contains at least one lesson, don't allow to delete
    if (check)
      return res.status(400).json({
        success: false,
        message: `This section is containing at least 1 lesson, make sure there's no lesson and try again`,
        data: null
      });

    const updatedCourse = await Course.findByIdAndUpdate(
      courseId,
      {
        $pull: {
          sections: {
            _id: sectionId
          }
        },
        status: 'unpublic'
      },
      {
        new: true
      }
    );

    const _updatedCourse = JSON.parse(JSON.stringify(updatedCourse));
    updatedCourse.lessons.forEach((lesson, index) => {
      const found = updatedCourse.sections.find(section => section._id === lesson.section);
      _updatedCourse.lessons[index].section = found ? found : lesson.section;
    })

    return res.status(200).json({
      success: true,
      message: 'Delete section successfully',
      data: _updatedCourse
    })
  }
  catch (error) {
    console.log(chalk.red('error: '));
    console.log(error);
    return res.status(400).json({
      success: false,
      message: 'Delete section fail, try again!',
      data: null
    })
  }
}

const updateSection = async (req, res) => {
  try {
    const { courseId, sectionId } = req.params;
    const { index, name, sameIndexAcceptable } = req.body;

    if (!sameIndexAcceptable) {
      const duplicated = await Course.findOne({
        _id: courseId,
        sections: {
          $elemMatch: {
            index
          }
        }
      });

      if (duplicated)
        return res.status(400).json({
          success: false,
          message: 'Exist current section index in this course',
          data: null
        });
    };

    // check if any changes
    const [course] = await Course.aggregate([{ $match: { _id: courseId } }, { $limit: 1 }]);
    const sectionInfo = course.sections.find(_ => _._id === sectionId);
    console.log('sectionInfo: ', sectionInfo);
    console.log('req.body: ', req.body);

    let flag = false;
    Object.keys(req.body).filter(_ => Object.keys(sectionInfo).includes(_)).forEach(key => {
      if (JSON.stringify(req.body[`${key}`]) !== JSON.stringify(sectionInfo[`${key}`])) {
        flag = true;
        return;
      }
    });
    if (!flag)
      return res.status(400).json({
        success: false,
        message: `No data was changed`,
        data: null
      });

    // update changes
    const courseUpdated = await Course.findOneAndUpdate(
      {
        _id: courseId,
        'sections._id': sectionId
      },
      {
        $set: {
          'sections.$.index': index,
          'sections.$.name': name
        },
        status: 'unpublic'
      },
      {
        new: true
      }
    );

    const _courseUpdated = JSON.parse(JSON.stringify(courseUpdated));
    courseUpdated.lessons.forEach((lesson, index) => {
      const found = courseUpdated.sections.find(section => section._id === lesson.section);
      _courseUpdated.lessons[index].section = found ? found : lesson.section;
    })

    return res.status(200).json({
      success: true,
      message: 'Update section successfully',
      data: _courseUpdated
    })
  }
  catch (error) {
    console.log(chalk.red('error: '));
    console.log(error);
    return res.status(400).json({
      success: false,
      message: 'Update section fail, try again!',
      data: null
    })
  }
}

const addLesson = async (req, res) => {
  try {
    const { index, section, title, content, video_link, document_link, free_preview, duration } = req.body;
    const { courseId } = req.params;

    const updated = await Course.findOneAndUpdate(
      { _id: courseId },
      {
        $push: {
          lessons: { index, section, title, content, video_link, document_link, free_preview, duration, slug: slugify(title) }
        },
        status: 'unpublic'
      },
      { new: true }
    ).populate({ path: 'instructor', select: '_id name' });

    const _updated = JSON.parse(JSON.stringify(updated));
    updated.lessons.forEach((lesson, index) => {
      const found = updated.sections.find(section => section._id === lesson.section);
      _updated.lessons[index].section = found ? found : lesson.section
    });

    return res.status(201).json({
      success: true,
      message: 'Add lesson to course successfully',
      data: _updated
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

const deleteLesson = async (req, res) => {
  try {
    const { courseId, lessonId } = req.params;

    let course = await Course.findByIdAndUpdate(
      courseId,
      {
        $pull: {
          lessons: { _id: lessonId }
        },
        status: 'unpublic'
      },
      { new: true }
    );
    if (!course)
      return res.status(400).json({
        success: false,
        message: 'Not found lesson or course, try again!',
        data: null
      });

    const _updated = JSON.parse(JSON.stringify(course));
    course.lessons.forEach((lesson, index) => {
      const found = course.sections.find(section => section._id === lesson.section);
      _updated.lessons[index].section = found ? found : lesson.section
    });

    return res.status(200).json({
      success: true,
      message: 'Delete lesson from course successfully!',
      data: _updated
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
    const { sameIndexAcceptable } = req.body;
    const { index, section, title, content, duration, video_link, document_link, free_preview } = req.body.lesson;

    const course = await Course.findById(courseId);
    const lessonIndexes = course.lessons.filter(lesson => lesson.section === section).map(lesson => lesson.index);

    if (!sameIndexAcceptable)
      if (lessonIndexes.includes(index))
        return res.status(400).json({
          success: false,
          message: 'Index is taken, please choose another one',
          data: null
        });

    // check if any changes
    const [_course] = await Course.aggregate([{ $match: { _id: courseId } }, { $limit: 1 }]);
    const lessonInfo = course.lessons.find(_ => _._id === lessonId);

    let flag = false;
    let array = [];
    Object.keys(req.body.lesson).forEach(key => {
      array.push({ old: JSON.stringify(lessonInfo[`${key}`]), new: JSON.stringify(req.body.lesson[`${key}`]) })
      if (JSON.stringify(req.body.lesson[`${key}`]) !== JSON.stringify(lessonInfo[`${key}`])) {
        flag = true;
        return;
      }
    });
    console.log(chalk.blue('array: '), array)
    if (!flag)
      return res.status(400).json({
        success: false,
        message: `No data was changed`,
        data: null
      });

    // update params
    let params = {};
    if (title) params['lessons.$.title'] = title;
    if (title) params['lessons.$.slug'] = slugify(title);
    if (content) params['lessons.$.content'] = content;
    if (duration) params['lessons.$.duration'] = duration;
    if (video_link) params['lessons.$.video_link'] = video_link;
    if (document_link) params['lessons.$.document_link'] = document_link;
    if (free_preview) params['lessons.$.free_preview'] = free_preview;
    if (index) params['lessons.$.index'] = index;
    if (section) params['lessons.$.section'] = section;
    console.log(chalk.blue('params: '), params)

    // update changes
    const updated = await Course.findOneAndUpdate(
      { "lessons._id": lessonId },
      {
        $set: params,
        status: 'unpublic'
      },
      { new: true }
    );

    if (!updated)
      return res.status(400).json({
        success: false,
        message: 'No lesson found',
        data: null
      });

    const _updated = JSON.parse(JSON.stringify(updated));
    updated?.lessons?.forEach((lesson, index) => {
      const found = updated?.sections?.find(section => section?._id === lesson?.section);
      _updated.lessons[index].section = found ? found : lesson?.section
    });

    // const __updated = populate(updated, 'lessons', 'section', 'sections');

    return res.status(200).json({
      success: true,
      message: 'Update lesson successfully',
      data: _updated
    })
  }
  catch (error) {
    console.log(chalk.red('error: '));
    console.log(error);
    return res.status(400).json({
      success: false,
      message: 'Update lesson fail, try again!',
      data: null
    })
  }
}

const addQuiz = async (req, res) => {
  try {
    console.log(chalk.blue('req.body: '), req.body);
    const { courseId, lessonId } = req.params;
    const { question, answer, correctAnswer } = req.body.quiz;

    const checkExist = await Course.findOne({
      _id: courseId,
      'quizzes.lesson': lessonId
    });

    if (checkExist)
      return res.status(400).json({
        success: false,
        message: 'Current lesson has already had quiz, try updating or deleting instead',
        data: null
      });

    const updatedCourse = await Course.findByIdAndUpdate(
      courseId,
      {
        $push: {
          quizzes: { lesson: lessonId, question, answer, correctAnswer }
        },
        status: 'unpublic'
      },
      {
        new: true
      }
    );

    const _updated = JSON.parse(JSON.stringify(updatedCourse));
    updatedCourse?.lessons?.forEach((lesson, index) => {
      const sectionFound = updatedCourse?.sections?.find(section => section?._id === lesson?.section);
      _updated.lessons[index].section = sectionFound ? sectionFound : lesson?.section
    });

    return res.status(200).json({
      success: true,
      message: 'Add quiz successfully',
      data: _updated
    })
  }
  catch (error) {
    console.log(chalk.red('error: '));
    console.log(error);
    return res.status(400).json({
      success: false,
      message: 'Add quiz fail, try again!',
      data: null
    })
  }
}

const deleteQuiz = async (req, res) => {
  try {
    const { courseId, lessonId, quizId } = req.params;

    let course = await Course.findByIdAndUpdate(
      courseId,
      {
        $pull: {
          quizzes: { _id: quizId }
        },
        status: 'unpublic'
      },
      { new: true }
    );
    if (!course)
      return res.status(400).json({
        success: false,
        message: 'Not found lesson or course, try again!',
        data: null
      });

    const _updated = JSON.parse(JSON.stringify(course));
    course.lessons.forEach((lesson, index) => {
      const found = course.sections.find(section => section._id === lesson.section);
      _updated.lessons[index].section = found ? found : lesson.section
    });

    return res.status(200).json({
      success: true,
      message: 'Delete lesson from course successfully!',
      data: _updated
    });
  }
  catch (error) {
    console.log(chalk.red('error: '));
    console.log(error);
    return res.status(400).json({
      success: false,
      message: 'Delete quiz fail, try again!',
      data: null
    })
  }
}

const updateQuiz = async (req, res) => {
  try {
    const { courseId, lessonId, quizId } = req.params;
    const { question, answer, correctAnswer } = req.body.quiz;

    // check if any changes
    const [_course] = await Course.aggregate([{ $match: { _id: courseId } }, { $limit: 1 }]);
    const quizInfo = _course.quizzes.find(_ => _._id === quizId);
    console.log('quizInfo: ', quizInfo);
    console.log('req.body.quiz: ', req.body.quiz);

    let flag = false;
    Object.keys(req.body.quiz).forEach(key => {
      if (JSON.stringify(req.body.quiz[`${key}`]) !== JSON.stringify(quizInfo[`${key}`])) {
        flag = true;
        return;
      }
    });
    if (!flag)
      return res.status(400).json({
        success: false,
        message: `No data was changed`,
        data: null
      });

    // update changes
    const updated = await Course.findOneAndUpdate(
      { "quizzes._id": quizId },
      {
        $set: {
          "quizzes.$.question": question,
          "quizzes.$.answer": answer,
          "quizzes.$.correctAnswer": correctAnswer,
        },
        status: 'unpublic'
      },
      { new: true }
    );

    const _updated = JSON.parse(JSON.stringify(updated));
    updated?.lessons?.forEach((lesson, index) => {
      const found = updated?.sections?.find(section => section?._id === lesson?.section);
      _updated.lessons[index].section = found ? found : lesson?.section
    });

    return res.status(200).json({
      success: true,
      message: 'Update lesson successfully',
      data: _updated
    })
  }
  catch (error) {
    console.log(chalk.red('error: '));
    console.log(error);
    return res.status(400).json({
      success: false,
      message: 'Update quiz fail, try again!',
      data: null
    })
  }
}

const getAllCourses = async (req, res) => {
  try {
    const course = await Course.find();

    let _course = JSON.parse(JSON.stringify(course));
    course?.forEach((course, index_course) => {
      course?.lessons?.forEach((lesson, index_lesson) => {
        const found = course?.sections?.find(section => section._id === lesson.section);
        _course[index_course].lessons[index_lesson].section = found ? found : lesson?.section
      });
    });

    return res.status(200).json({
      success: true,
      message: 'Get all course by admin successfully',
      data: _course
    })
  }
  catch (error) {
    console.log(chalk.red('error: '));
    console.log(error);
    return res.status(400).json({
      success: false,
      message: 'Get courses by admin fail, try again!',
      data: null
    })
  }
}

const getCourseInspectByAdmin = async (req, res) => {
  try {
    // const courses = await Course.find({
    //   status: 'unaccepted',
    //   published: (type === 'new') ? false : true
    // });

    let filters = {};
    filters['status'] = 'unaccepted';
    if (req.query.type) filters['published'] = req.query.type === 'new' ? false : true;

    const courses = await Course.aggregate([
      {
        $match: filters
      },
      {
        $lookup: {
          from: 'users',
          let: { course_instructor: '$instructor' },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ['$_id', '$$course_instructor'] }
                  ]
                }
              }
            }
          ],
          as: 'instructorInfo'
        }
      },
      {
        $lookup: {
          from: 'categories',
          let: { course_category: '$category' },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ['$_id', '$$course_category'] }
                  ]
                }
              }
            }
          ],
          as: 'categoryInfo'
        }
      },
      {
        $lookup: {
          from: 'categories',
          let: { course_official_data_category: '$official_data.category' },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ['$_id', '$$course_official_data_category'] }
                  ]
                }
              }
            }
          ],
          as: 'official_data.categoryInfo'
        }
      },
      {
        $set: {
          instructorInfo: { $first: '$instructorInfo' },
          categoryInfo: { $first: '$categoryInfo' },
          'official_data.categoryInfo': { $first: '$official_data.categoryInfo' },
        }
      }
    ]);

    let _courses = JSON.parse(JSON.stringify(courses));
    courses?.forEach((course, index_course) => {
      courses?.lessons?.forEach((lesson, index_lesson) => {
        const found = courses?.sections?.find(section => section._id === lesson.section);
        _courses[index_course].lessons[index_lesson].section = found ? found : lesson?.section
      });
    });

    return res.status(200).json({
      success: true,
      message: `Get unpulic ${req.query.type} courses by admin successfully`,
      data: _courses
    })
  }
  catch (error) {
    console.log(chalk.red('error: '));
    console.log(error);
    return res.status(400).json({
      success: false,
      message: `Get unpulic ${req.query.type} courses by admin fail, try again!`,
      data: null
    })
  }
}

const getDetailCourseInspectByAdmin = async (req, res) => {
  try {
    const { courseId } = req.params;

    let filters = {};
    filters['_id'] = courseId;
    filters['status'] = 'unaccepted';
    if (req.query.type) filters['published'] = req.query.type === 'new' ? false : true;

    const [course] = await Course.aggregate([
      {
        $match: filters
      },
      {
        $lookup: {
          from: 'users',
          let: { course_instructor: '$instructor' },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ['$_id', '$$course_instructor'] }
                  ]
                }
              }
            }
          ],
          as: 'instructorInfo'
        }
      },
      {
        $lookup: {
          from: 'categories',
          let: { course_category: '$category' },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ['$_id', '$$course_category'] }
                  ]
                }
              }
            }
          ],
          as: 'categoryInfo'
        }
      },
      {
        $lookup: {
          from: 'categories',
          let: { course_official_data_category: '$official_data.category' },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ['$_id', '$$course_official_data_category'] }
                  ]
                }
              }
            }
          ],
          as: 'official_data.categoryInfo'
        }
      },
      {
        $set: {
          instructorInfo: { $first: '$instructorInfo' },
          categoryInfo: { $first: '$categoryInfo' },
          'official_data.categoryInfo': { $first: '$official_data.categoryInfo' },
        }
      },
      {
        $limit: 1
      }
    ]);

    const _course = JSON.parse(JSON.stringify(course));
    course?.lessons?.forEach((lesson, index) => {
      const found = course.sections.find(section => section?._id === lesson?.section);
      _course.lessons[index].section = found ? found : lesson?.section
    });

    return res.status(200).json({
      success: true,
      message: `Get detail of unpulic ${req.query.type} courses by admin successfully`,
      data: _course
    });
  }
  catch (error) {
    console.log(chalk.red('error: '));
    console.log(error);
    return res.status(400).json({
      success: false,
      message: `Get detail of unpulic ${req.body.type} courses by admin fail, try again!`,
      data: null
    })
  }
}

const reviewNewCourseToPublish = async (req, res) => {
  try {
    const { courseId } = req.params;
    const { isAccepted, reasons } = req.body;

    const course = await Course.findOne({
      _id: courseId,
      status: 'unaccepted'
    }).select('-official_data');

    course.published = isAccepted;
    course.status = isAccepted ? 'public' : 'rejected';
    course.rejected_reasons = isAccepted ? [] : reasons;
    course.official_data = isAccepted ? lodash.cloneDeep(course) : {};

    await course.save();

    const _course = JSON.parse(JSON.stringify(course));
    course?.lessons?.forEach((lesson, index) => {
      const found = course.sections.find(section => section?._id === lesson?.section);
      _course.lessons[index].section = found ? found : lesson?.section
    });

    return res.status(200).json({
      success: true,
      message: 'Grant permission for this course successfully',
      data: _course
    });
  }
  catch (error) {
    console.log(chalk.red('error: '));
    console.log(error);
    return res.status(400).json({
      success: false,
      message: 'Review new course to publish by admin fail, try again!',
      data: null
    })
  }
}

const reviewEditCourseToPublish = async (req, res) => {
  try {
    const { courseId } = req.params;
    const { isAccepted, reasons } = req.body;

    const course = await Course.findOne({
      _id: courseId,
      status: 'unaccepted'
    }).select('-official_data');

    course.status = isAccepted ? 'public' : 'rejected';
    course.rejected_reasons = isAccepted ? [] : reasons;
    isAccepted && (course.official_data = lodash.cloneDeep(course));

    await course.save();

    const _course = JSON.parse(JSON.stringify(course));
    course?.lessons?.forEach((lesson, index) => {
      const found = course.sections.find(section => section?._id === lesson?.section);
      _course.lessons[index].section = found ? found : lesson?.section
    });

    return res.status(200).json({
      success: true,
      message: 'Grant permission for this course successfully',
      data: _course
    });
  }
  catch (error) {
    console.log(chalk.red('error: '));
    console.log(error);
    return res.status(400).json({
      success: false,
      message: 'Review new course to publish by admin fail, try again!',
      data: null
    })
  }
}

const getAllVideoLinks = async (req, res) => {
  try {
    const couresVideoLinks = await Course.aggregate([
      {
        $unwind: '$lessons'
      },
      {
        $project: {
          _id: 1,
          name: 1,
          slug: 1,
          lessons: { video_link: { Key: 1 } },
        }
      },
      {
        $set: {
          lessons: '$lessons.video_link.Key'
        }
      },
      {
        $group: {
          _id: '$_id',
          name: { $first: '$name' },
          slug: { $first: '$slug' },
          lessons: { $push: '$lessons' }
        }
      },
    ]);

    return res.status(200).json({
      success: true,
      message: 'get all video links successfully',
      data: {
        data: couresVideoLinks,
        total: couresVideoLinks.length,
      }
    })
  }
  catch (error) {
    console.log(chalk.red('error: '));
    console.log(error);
    return res.status(400).json({
      success: false,
      message: 'get all video links fail, try again!',
      data: null
    })
  }
}


export {
  isAllowEditingCourse, // middleware
  checkUpdatingRights,  // middleware
  isChanged,  // middleware
  uploadImageController,
  removeImageController,
  removeListImageController,
  uploadPdfController,
  removePdfController,
  getPublishedCourses,
  getPublicCourseBySlug,
  getPublicCourseById,
  uploadVideoHandler,
  deleteVideoHandler,
  createCourse,
  updateCourse,
  submitPublish,
  submitUndoPublish,
  getInstructorCourses,
  getCourseBySlug,
  addSection,
  deleteSection,
  updateSection,
  addLesson,
  deleteLesson,
  updateLesson,
  addQuiz,
  deleteQuiz,
  updateQuiz,
  getAllCourses,
  getCourseInspectByAdmin,
  getDetailCourseInspectByAdmin,
  reviewNewCourseToPublish,
  reviewEditCourseToPublish,
  getAllVideoLinks,
}