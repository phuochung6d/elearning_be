import { nanoid } from 'nanoid';
import chalk from 'chalk';
import Course from '../models/course';
import User from '../models/user';
import Review from '../models/review';

const getPublicReview = async (req, res) => {
  try {
    const { courseId } = req.params;
    const { content, star } = req.query;
    
    const filterObj = {};
    if (courseId) filterObj['courseId'] = courseId;
    if (content?.length) filterObj['content'] = { $regex: content, $options: 'i' };
    if (star && star !== '0') filterObj['star'] = +star;

    const reviewTotal = await Review.find({ courseId }).select('star userId');

    const reviews = await Review.aggregate([
      {
        $match: filterObj
      },
      {
        $lookup: {
          from: 'users',
          let: { review_userId: "$userId" },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [{ $eq: ['$_id', '$$review_userId'] }]
                }
              }
            },
            {
              $project: { _id: 0, name: 1, picture: 1, role: 1 }
            }
          ],
          as: 'user'
        }
      },
      {
        $lookup: {
          from: 'courses',
          let: { review_courseId: "$courseId" },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [{ $eq: ['$_id', '$$review_courseId'] }]
                }
              }
            },
            {
              $project: { sections: 0, lessons: 0, quizzes: 0, summary: 0, description: 0, requirements: 0, goal: 0, image: 0, __v: 0 }
            },
            {
              $lookup: {
                from: 'users',
                let: { review_courseId_instructor: '$instructor' },
                pipeline: [
                  {
                    $match: {
                      $expr: {
                        $and: [{ $eq: ['$_id', '$$review_courseId_instructor'] }]
                      }
                    }
                  },
                  {
                    $project: { _id: 0, name: 1, picture: 1, role: 1 }
                  }
                ],
                as: 'instructorInfo'
              }
            },
            {
              $addFields: {
                instructorInfo: { $first: '$instructorInfo' }
              }
            }
          ],
          as: 'course'
        }
      },
      {
        $addFields: {
          user: { $first: '$user' },
          course: { $first: '$course' }
        }
      },
      {
        $sort: {
          updatedAt: -1
        }
      }
    ]);

    return res.status(200).json({
      success: true,
      message: 'Get public reviews successfully',
      data: {
        total: reviewTotal,
        list: reviews
      }
    });
  }
  catch (error) {
    console.log(chalk.red('error: '));
    console.log(error);
    return res.status(400).json({
      success: false,
      message: 'Get public review fail, try again!',
      data: null
    })
  }
}

const getPublicReviewById = async (req, res) => {
  try {
    const { courseId, reviewId } = req.params;

    const reviews = await Review.aggregate([
      {
        $match: {}
      }
    ]);

    return res.status(200).json({
      success: true,
      message: 'Get public review by id successfully',
      data: reviews
    });
  }
  catch (error) {
    console.log(chalk.red('error: '));
    console.log(error);
    return res.status(400).json({
      success: false,
      message: 'Get public review by id fail, try again!',
      data: null
    })
  }
}

const addReview = async (req, res) => {
  try {
    const { courseId } = req.params;
    const { star, content } = req.body.review;
    const { _id: userId } = req.user;

    const review = new Review({
      courseId,
      userId,
      content,
      star
    });

    await review.save();

    return res.status(201).json({
      success: true,
      message: 'Add new review successfully',
      data: review
    });
  }
  catch (error) {
    console.log(chalk.red('error: '));
    console.log(error);
    return res.status(400).json({
      success: false,
      message: 'Add review fail, try again!',
      data: null
    })
  }
}

const updateReview = async (req, res) => {
  try {
    const { courseId, reviewId } = req.params;
    const { star, content } = req.body.review;
    const { _id: { userId } } = req.user;

    const course = await Course.findById(courseId);
    if (!course)
      return res.status(400).json({
        success: false,
        message: 'Course not found',
        data: null
      });

    const review = await Review.findByIdAndUpdate(
      reviewId,
      {
        $set: {
          star, content
        }
      },
      { new: true }
    );

    return res.status(200).json({
      success: true,
      message: 'Update review successfully',
      data: review
    });
  }
  catch (error) {
    console.log(chalk.red('error: '));
    console.log(error);
    return res.status(400).json({
      success: false,
      message: 'Update review fail, try again!',
      data: null
    })
  }
}

const deleteReview = async (req, res) => {
  try {
    const { courseId, reviewId } = req.params;

    const course = await Course.findById(courseId);
    if (!course)
      return res.status(400).json({
        success: false,
        message: 'Course not found',
        data: null
      })

    await Review.findByIdAndDelete(
      reviewId,
      { new: true }
    );

    return res.status(200).json({
      success: true,
      message: 'Delete review successfully',
      data: null
    });
  }
  catch (error) {
    console.log(chalk.red('error: '));
    console.log(error);
    return res.status(400).json({
      success: false,
      message: 'Delete review fail, try again!',
      data: null
    })
  }
}

const getAllReviews = async (req, res) => {
  try {
    const reviews = await Review.find();

    return res.status(200).json({
      success: true,
      message: 'Get all review by admin successfully, try again',
      data: reviews,
    })
  }
  catch (error) {
    console.log(chalk.red('error: '));
    console.log(error);
    return res.status(400).json({
      success: false,
      message: 'Get all reviews fail, try again!',
      data: null
    })
  }
}

export {
  getPublicReview,
  getPublicReviewById,
  addReview,
  updateReview,
  deleteReview,
  getAllReviews,
}