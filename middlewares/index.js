import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
dotenv.config();
import chalk from 'chalk';
import User from '../models/user';
import Course from '../models/course';

const requireSignin = (req, res, next) => {
  try {
    const arrayCookie = req.headers.cookie.split(' ');
    let cookie = '';
    arrayCookie.forEach(item => {if (item.indexOf('token') >= 0) cookie =  item});
    const decoded = jwt.verify(
      cookie.replace('token=', '').replace(';', ''), 
      process.env.JWT_SECRET
    );
    // console.log(chalk.blue('middleware decoded'), decoded);
    req.user = decoded;
    next();
  }
  catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized',
      data: null
    })
  }
}

const isInstructor = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user || !user.role.includes('Instructor'))
      return res.status(403).json({
        success: false,
        message: 'Forbidden route for not instructor role',
        data: null
      })

    next();
  }
  catch (error) {
    console.log(chalk.red('error: '));
    console.log(error);
    return res.status(401).json({
      success: false,
      message: 'Not instructor',
      data: null
    })
  }
}

const verifyRole = (...roles) => {
  return async (req, res, next) => {
    const user = await User.findById(req.user._id);
    if (!roles.includes(user.role))
      return res.status(403).json({
        success: false,
        message: 'Forbidden route for this role',
        data: null
      });

    next();
  }
}

const isCurrentUserWithRole = (...roles) => {
  return async (req, res, next) => {
    const user = await User.findById(req.user._id);
    
  }
}

const isCurrentInstructor = (req, res, next) => {
  try {
    if (req.user._id !== req.params.instructorId && req.user._id !== req.body.instructorId)
      return res.status(401).json({
        success: false,
        message: 'Not current instructor',
        data: null
      });
    next();
  }
  catch(error) {
    console.log(chalk.red('error: '));
    console.log(error);
    return res.status(401).json({
      success: false,
      message: 'Not current instructor',
      data: null
    })
  }
}

const isEnrolled = async (req, res, next) => {
  try {
    const { slug, courseId } = req.params;
    const { _id: idUser } = req.user;

    const course = await Course.findOne(slug ? { slug } : { _id: courseId });

    const user = await User.findById({ _id: idUser });

    // console.log(chalk.blue('course: '), course);
    // console.log(chalk.blue('user: '), user);

    if (user.courses.findIndex(item => item.courseId === course._id) === -1)
      return res.status(403).json({
        success: false,
        message: 'Not authorized',
        data: null
      })

    next();
  }
  catch (error) {
    console.log(chalk.red('error: '));
    console.log(error);
    return res.status(401).json({
      success: false,
      message: 'Not authorized',
      data: null
    })
  }
}

export {
  requireSignin,
  isInstructor,
  verifyRole,
  isCurrentInstructor,
  isEnrolled,
}