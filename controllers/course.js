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

const getPublicCourseBySlug = async (req, res) => {
  if (!req.query.date)
    req.query.data = Date.now();

  try {
    const course = await Course
      .findOne({ slug: req.params.slug })
      .populate({ path: 'instructor', select: 'name role' })
      .select('name summary goal requirements languages slug description image category price paid updatedAt lessons');
    if (!course)
      return res.status(204).json({
        success: false,
        message: `No course found. Time: ${req.query.date}`,
        data: null
      });

    return res.status(200).json({
      success: true,
      message: `Get course successfully. Time: ${req.query.date}`,
      data: course
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
    const course = await Course.findById(req.params.courseId);

    if (!course)
      return res.status(400).json({
        success: false,
        message: 'No course found with this id',
        data: null
      });

    return res.status(200).json({
      success: true,
      message: 'Get course by id successfully',
      data: course
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

    const value = {};
    ['name', 'summary', 'slug', 'image', 'description', 'category', 'paid', 'price', 'published', 'requirements', 'goal', 'languages']
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

const getInstructorCourses = async (req, res) => {
  try {
    const instructorCourses = await Course
      .find({ instructor: req.user._id });

    let _instructorCourses = JSON.parse(JSON.stringify(instructorCourses));
    instructorCourses?.forEach((course, index_course) => {
      course?.lessons?.forEach((lesson, index_lesson) => {
        const found = course?.sections?.find(section => section._id === lesson.section);
        _instructorCourses[index_course].lessons[index_lesson].section = found ? found : lesson?.section
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
    const course = await Course
      .findOne({ slug: req.params.slug })
      .populate({ path: 'instructor', select: 'name role' });

    const _course = JSON.parse(JSON.stringify(course));
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
        }
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
        }
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
    }

    const courseUpdated = await Course.findOneAndUpdate(
      {
        _id: courseId,
        'sections._id': sectionId
      },
      {
        $set: {
          'sections.$.index': index,
          'sections.$.name': name
        }
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
    const { index, section, title, content, video_link, free_preview, duration } = req.body;
    const { courseId } = req.params;

    const updated = await Course.findOneAndUpdate(
      { _id: courseId },
      {
        $push: {
          lessons: { index, section, title, content, video_link, free_preview, duration, slug: slugify(title) }
        }
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
        }
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
    const { index, section, title, content, duration, video_link, free_preview } = req.body.lesson;

    const course = await Course.findById(courseId);
    const lessonIndexes = course.lessons.filter(lesson => lesson.section === section).map(lesson => lesson.index);

    console.log('index: ', index);
    console.log('lessonIndexes: ', lessonIndexes);

    if (!sameIndexAcceptable)
      if (lessonIndexes.includes(index))
        return res.status(400).json({
          success: false,
          message: 'Index is taken, please choose another one',
          data: null
        });

    const updated = await Course.findOneAndUpdate(
      { "lessons._id": lessonId },
      {
        $set: {
          "lessons.$.title": title,
          "lessons.$.slug": slugify(title),
          "lessons.$.content": content,
          "lessons.$.duration": duration,
          "lessons.$.video_link": video_link,
          "lessons.$.free_preview": free_preview,
          "lessons.$.index": index,
          "lessons.$.section": section
        }
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
      message: 'Delete lesson fail, try again!',
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
        }
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
        }
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

    const updated = await Course.findOneAndUpdate(
      { "quizzes._id": quizId },
      {
        $set: {
          "quizzes.$.question": question,
          "quizzes.$.answer": answer,
          "quizzes.$.correctAnswer": correctAnswer,
        }
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

export {
  uploadImageController,
  removeImageController,
  getPublishedCourses,
  getPublicCourseBySlug,
  getPublicCourseById,
  uploadVideoHandler,
  deleteVideoHandler,
  createCourse,
  updateCourse,
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
}