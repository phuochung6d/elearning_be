import { nanoid } from 'nanoid';
import chalk from 'chalk';
import QA from '../models/qa';

const getQAs = async (req, res) => {
  try {
    const { courseId } = req.params;
    const { content, lessonId, other } = req.query;

    console.log('req.query: ', req.query);

    const filterObj = {};
    filterObj['type'] = 'new';
    if (courseId) filterObj['courseId'] = courseId;
    if (content) filterObj['$or'] = [
      {
        content: { $regex: content, $options: 'i' },
      },
      {
        title: { $regex: content, $options: 'i' },
      }
    ];
    if (lessonId && lessonId !== 'all') filterObj['lessonId'] = lessonId;
    if (other === 'currentuser_asked') filterObj['userId'] = req.user._id;

    console.log(filterObj);

    const qas = await QA.aggregate([
      {
        $match: {
          ...filterObj,
        }
      },
      {
        $lookup: {
          from: 'users',
          let: { qa_userId: "$userId" },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [{ $eq: ['$_id', '$$qa_userId'] }]
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
          let: { qa_courseId: "$courseId" },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [{ $eq: ['$_id', '$$qa_courseId'] }]
                }
              }
            },
            {
              $project: {
                name: 1,
                slug: 1,
                instructor: 1,
                sections: { _id: 1, index: 1, name: 1 },
                lessons: { _id: 1, index: 1, title: 1, section: 1 }
              }
            },
            {
              $lookup: {
                from: 'users',
                let: { qa_courseId_instructor: '$instructor' },
                pipeline: [
                  {
                    $match: {
                      $expr: {
                        $and: [{ $eq: ['$_id', '$$qa_courseId_instructor'] }]
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
          course: { $first: '$course' },
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
      message: 'Get Q&A of course successfully',
      data: qas
    });
  }
  catch (error) {
    console.log(chalk.red('error: '));
    console.log(error);
    return res.status(400).json({
      success: false,
      message: 'Get Q&As fail, try again!',
      data: null
    })
  }
}

const getQAByIdOfLesson = async (req, res) => {
  try {

  }
  catch (error) {
    console.log(chalk.red('error: '));
    console.log(error);
    return res.status(400).json({
      success: false,
      message: 'Get Q&A by ID fail, try again!',
      data: null
    })
  }
}

const addQA = async (req, res) => {
  try {
    const { courseId, lessonId } = req.params;
    const { title, content, replyQAId } = req.body.qa;
    const { _id: userId } = req.user;

    let newQA = {};
    if (!replyQAId) {
      newQA = new QA({
        userId,
        courseId,
        lessonId,
        title,
        content,
        type: 'new'
      });
    } else {
      newQA = new QA({
        userId,
        courseId,
        lessonId,
        content,
        type: 'reply',
        replyQAId
      });
    }

    await newQA.save();

    return res.status(201).json({
      success: true,
      message: 'Add QA successfully',
      data: newQA
    });
  }
  catch (error) {
    console.log(chalk.red('error: '));
    console.log(error);
    return res.status(400).json({
      success: false,
      message: 'Add Q&A fail, try again!',
      data: null
    })
  }
}

const updateQA = async (req, res) => {
  try {
    const { courseId, lessonId, qaId } = req.params;
    const { title, content, replyQAId } = req.body.qa;

    if (!replyQAId) {
      await QA.findOneAndUpdate(
        {
          _id: qaId,
          courseId,
          lessonId,
        },
        {
          title,
          content,
        }
      );
    } else {
      await QA.findOneAndUpdate(
        {
          _id: qaId,
          courseId,
          lessonId,
        },
        {
          content,
        }
      );
    }

    return res.status(200).json({
      success: true,
      message: 'Update Q&A successfully',
      data: null
    });
  }
  catch (error) {
    console.log(chalk.red('error: '));
    console.log(error);
    return res.status(400).json({
      success: false,
      message: 'Update Q&A fail, try again!',
      data: null
    })
  }
}

const deleteQA = async (req, res) => {
  try {
    const { courseId, lessonId, qaId } = req.params;

    await QA.findOneAndDelete({
      _id: qaId,
      courseId,
      lessonId,
    });

    return res.status(200).json({
      success: true,
      message: 'Delete QA successfully',
      data: null
    });
  }
  catch (error) {
    console.log(chalk.red('error: '));
    console.log(error);
    return res.status(400).json({
      success: false,
      message: 'Delete Q&A fail, try again!',
      data: null
    })
  }
}

const getQAReplies = async (req, res) => {
  try {
    const { courseId, qaId } = req.params;
    
    const replies = await QA.aggregate([
      {
        $match: {
          replyQAId: qaId,
          type: 'reply'
        }
      },
      {
        $lookup: {
          from: 'users',
          let: { reply_userId: "$userId" },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [{ $eq: ['$_id', '$$reply_userId'] }]
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
          let: { reply_courseId: "$courseId" },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [{ $eq: ['$_id', '$$reply_courseId'] }]
                }
              }
            },
            {
              $project: {
                name: 1,
                slug: 1,
                instructor: 1,
                sections: { _id: 1, index: 1, name: 1 },
                lessons: { _id: 1, index: 1, title: 1, section: 1 }
              }
            },
            {
              $lookup: {
                from: 'users',
                let: { reply_courseId_instructor: '$instructor' },
                pipeline: [
                  {
                    $match: {
                      $expr: {
                        $and: [{ $eq: ['$_id', '$$reply_courseId_instructor'] }]
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
          course: { $first: '$course' },
        }
      },
      {
        $sort: {
          createdAt: 1
        }
      }
    ]);

    return res.status(200).json({
      success: true,
      message: 'Get replies of QA successfully',
      data: replies
    })
  }
  catch (error) {
    console.log(chalk.red('error: '));
    console.log(error);
    return res.status(400).json({
      success: false,
      message: 'Get replies of QA unsuccessfully, try again!',
      data: null
    })
  }
}

export {
  getQAs,
  getQAByIdOfLesson,
  addQA,
  updateQA,
  deleteQA,
  getQAReplies,
}