import chalk from 'chalk';
import User from '../models/user';
import Course from '../models/course';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const SUFFIX_STRIPE_USD = 100;

const checkEnrollment = async (req, res) => {
  try {
    const { courseId } = req.params;

    const user = await User.findById(req.user._id).select('-password -passwordResetCode');

    if (!user) return res.status(400).json({
      success: false,
      message: 'Can not recognize current user',
      data: null
    });

    const isEnrolled = user.courses.findIndex(course => course.courseId === courseId);

    if (isEnrolled === -1)
      return res.status(200).json({
        success: false,
        message: `Current user hasn't enrolled to this course yet`,
        data: null,
      });

    return res.status(200).json({
      success: true,
      message: `Current user has already enrolled to this course`,
      data: user,
    })
  }
  catch (error) {
    console.log(chalk.red('error: '));
    console.log(error);
    return res.status(400).json({
      success: false,
      message: 'Check enrollment fail, try again!',
      data: null,
    })
  }
}

const freeEnrollmentController = async (req, res) => {
  try {
    const { courseId } = req.params;

    const course = await Course.findById(courseId).populate({ path: 'instructor' });
    if (req.user._id === course.instructor._id)
      return res.status(400).json({
        success: false,
        message: 'This course is yours, can not do the paying operation',
        data: null
      })

    const user = await User.findByIdAndUpdate(
      req.user._id,
      {
        $addToSet: {
          courses: {
            courseId: courseId,
            completedLessons: [],
            completedQuizzes: [],
          }
        },
      },
      { new: true }
    ).select('-password -passwordResetCode');

    if (!user)
      return res.status(400).json({
        success: false,
        message: 'Something went wrong, please try again!',
        data: null
      });

    return res.status(200).json({
      success: true,
      message: 'Enroll successfully, now you can see this course',
      data: user
    });
  }
  catch (error) {
    console.log(chalk.red('error: '));
    console.log(error);
    return res.status(400).json({
      success: false,
      message: `Free enroll fail, try again!`,
      data: null
    })
  }
}

const paidEnrollmentController = async (req, res) => {
  try {
    const { courseId } = req.params;
    const course = await Course.findById(courseId).populate({ path: 'instructor' });

    // 30% of application fee
    const fee = (course.price * 50) / 100;

    // stripe session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment',
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: course.name,
            },
            unit_amount: Math.round(course.price.toFixed(2) * SUFFIX_STRIPE_USD)
          },
          quantity: 1
        },
      ],
      // charge buyer and transfer remaining balance to seller (after fee)
      payment_intent_data: {
        // application_fee_amount: Math.round(fee.toFixed(2) * SUFFIX_STRIPE_USD),
        application_fee_amount: Math.round(fee.toFixed(2) * SUFFIX_STRIPE_USD),
        transfer_data: {
          destination: course.instructor.stripe_account_id,
        }
      },
      // redirect url after successful payment
      success_url: `${process.env.STRIPE_SUCCESS_URL}/${course._id}`,
      cancel_url: `${process.env.STRIPE_CANCEL_URL}`
    });

    console.log('SESSION -> ', session);

    await User.findByIdAndUpdate(
      req.user._id,
      {
        stripeSession: session
      }
    );

    return res.status(200).json({
      success: true,
      message: 'Checkout !',
      data: session
    })
  }
  catch (error) {
    console.log(chalk.red('error: '));
    console.log(error);
    return res.status(400).json({
      success: false,
      message: `Buy fail, try again! Detail: ${error.message}`,
      data: null
    })
  }
}

const stripeSuccessRequest = async (req, res) => {
  try {
    const { courseId } = req.params;

    // get user to get stripeSessionId
    const user = await User.findById(req.user._id).select('-password -passwordResetCode');

    // retrieve stripe session info from stripe
    const session = await stripe.checkout.sessions.retrieve(user.stripeSession.id);
    console.log('RETRIEVE STRIPE SUCCESS: ', session);

    // if session payment status is paid, push courseId to course list of user
    if (session.payment_status === 'paid') {
      user.courses.findIndex(course => course._id === courseId) < 0
        && user.courses.push({
          courseId: courseId,
          completedLessons: [],
          completedQuizzes: [],
        });
      user.stripeSession = {};

      await user.save();
    } else {
      return res.status(400).json({
        success: false,
        message: 'Something went wrong while requesting stripe success infomation, try again!',
        data: null,
      })
    }

    return res.status(200).json({
      success: true,
      message: 'Request of Stripe Success is successful',
      data: user,
    })
  }
  catch (error) {
    console.log(chalk.red('error: '));
    console.log(error);
    return res.status(400).json({
      success: false,
      message: `Request of Stripe Success is fail, try again! Detail: ${error.message}`,
      data: null
    })
  }
}

const getEnrolledCourses = async (req, res) => {
  try {
    const enrolledCourses = await User
      .findById(req.user._id)
      .select('-password -passwordResetCode')
      .populate({
        path: 'courses',
        populate: {
          path: 'courseId', select: '_id name image slug instructor',
          populate: {
            path: 'instructor', select: '_id name'
          }
        }
      });

    let _instructorCourses = JSON.parse(JSON.stringify(enrolledCourses.courses));
    enrolledCourses?.courses?.forEach((course, index_course) => {
      course?.lessons?.forEach((lesson, index_lesson) => {
        const found = course?.sections?.find(section => section._id === lesson.section);
        _instructorCourses[index_course].lessons[index_lesson].section = found ? found : lesson?.section
      })
    })

    return res.status(200).json({
      success: true,
      message: 'Get enrolled courses successfully',
      data: enrolledCourses
    })
  }
  catch (error) {
    console.log(chalk.red('error: '));
    console.log(error);
    return res.status(400).json({
      success: false,
      message: `Get enrollled courses fail, try again! Detail: ${error.message}`,
      data: null
    })
  }
}

const getEnrolledCourseBySlug = async (req, res) => {
  try {
    const { slug } = req.params;

    const course = await Course
      .findOne({ slug })
      .populate({ path: 'instructor', select: '_id name' });

    if (!course)
      return res.status(400).json({
        success: false,
        message: 'System has not yet found this course, try again',
        data: null,
      });

    const _course = JSON.parse(JSON.stringify(course));
    course.lessons.forEach((lesson, index) => {
      const found = course.sections.find(section => section._id === lesson.section);
      _course.lessons[index].section = found ? found : lesson.section;
    })

    return res.status(200).json({
      success: true,
      message: 'Get detail of enrolled course successfully!',
      data: _course,
    })
  }
  catch (error) {
    console.log(chalk.red('error: '));
    console.log(error);
    return res.status(400).json({
      success: false,
      message: `Get detail of enrolled course fail, try again! Detail: ${error.message}`,
      data: null
    })
  }
}

const markLessonCompleted = async (req, res) => {
  try {
    const { courseId, lessonId } = req.params;

    const user = await User.findById(req.user._id).select('-password -passwordResetCode');

    const index = user.courses.findIndex(item => item.courseId === courseId);

    if (index >= 0) {
      if (!user.courses[index].completedLessons.includes(lessonId)) {
        user.courses[index].completedLessons.push(lessonId);
        await user.save();

        return res.status(200).json({
          success: true,
          message: 'Mark lesson complete successfully',
          data: user
        })
      }
      else {
        return res.status(200).json({
          success: true,
          message: 'This lesson has already been marked completed',
          data: user
        })
      }
    } else {
      return res.status(400).json({
        success: false,
        message: `Current user hasn't enrolled to this course yet`,
        data: null
      })
    }
  }
  catch (error) {
    console.log(chalk.red('error: '));
    console.log(error);
    return res.status(400).json({
      success: false,
      message: `Mark complete fail, try again! Detail: ${error.message}`,
      data: null
    })
  }
}

const markLessonIncompleted = async (req, res) => {
  try {
    const { courseId, lessonId } = req.params;

    const user = await User.findById(req.user._id).select('-password -passwordResetCode');

    const index = user.courses.findIndex(item => item.courseId === courseId);

    if (user.courses[index].completedLessons.includes(lessonId)) {
      const course = await Course.findById(courseId);
      const quizOfLesson = course.quizzes.find(quiz => quiz.lesson === lessonId);
      console.log('quizOfLesson: ', quizOfLesson);

      const tempCompletedLessons = user.courses[index].completedLessons.filter(_lessonId => _lessonId !== lessonId);
      const tempCompletedQuizzes = user.courses[index].completedQuizzes.filter(quizId => quizId !== quizOfLesson._id);

      user.courses[index].completedLessons = tempCompletedLessons;
      user.courses[index].completedQuizzes = tempCompletedQuizzes;

      await user.save();

      return res.status(200).json({
        success: true,
        message: 'Mark lesson incomplete successfully',
        data: user
      })
    }
    else {
      return res.status(200).json({
        success: true,
        message: `This lesson hasn't already completed actually`,
        data: user
      })
    }
  }
  catch (error) {
    console.log(chalk.red('error: '));
    console.log(error);
    return res.status(400).json({
      success: false,
      message: `Mark incomplete fail, try again! Detail: ${error.message}`,
      data: null
    })
  }
}

const submitQuiz = async (req, res, next) => {
  try {
    const { courseId, quizId } = req.params;
    const { index } = req.body.quiz;

    const course = await Course.findById(courseId);
    const quizInfo = course.quizzes.find(quiz => quiz._id === quizId);

    const correctAnswer = quizInfo.correctAnswer.find(_ => _.value === true).index;
    if (+index === +correctAnswer) {
      const user = await User.findById(req.user._id).select('-password -passwordResetCode');
      const index = user.courses.findIndex(item => item.courseId === courseId);
      if (!user.courses[index].completedQuizzes.includes(quizId))
        user.courses[index].completedQuizzes.push(quizId);

      await user.save();

      return res.status(200).json({
        success: true,
        message: 'You answered correctly',
        data: user
      });
    }
    else {
      const user = await User.findById(req.user._id).select('-password -passwordResetCode');
      const index = user.courses.findIndex(item => item.courseId === courseId);
      if (user.courses[index].completedQuizzes.includes(quizId)) {
        user.courses[index].completedQuizzes = user.courses[index].completedQuizzes.filter(id => id !== quizId);
        await user.save();
      }

      return res.status(200).json({
        success: false,
        message: 'You answered this question incorrectly',
        data: user
      });
    }
  }
  catch (error) {
    console.log(chalk.red('error: '));
    console.log(error);
    return res.status(400).json({
      success: false,
      message: `Submit quiz fail, try again! Detail: ${error.message}`,
      data: null
    })
  }
}

export {
  freeEnrollmentController,
  paidEnrollmentController,
  checkEnrollment,
  stripeSuccessRequest,
  getEnrolledCourses,
  getEnrolledCourseBySlug,
  markLessonCompleted,
  markLessonIncompleted,
  submitQuiz,
}