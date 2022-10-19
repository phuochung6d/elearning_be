import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
dotenv.config();
import chalk from 'chalk';
import User from '../models/user';

const requireSignin = (req, res, next) => {
  try {
    const decoded = jwt.verify(req.headers.cookie.replace('token=', ''), process.env.JWT_SECRET);
    // console.log(chalk.blueBright('middleware decoded'), decoded);
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
      message: 'Not authorized',
      data: null
    })
  }
}

const isCurrentInstructor = (req, res, next) => {
  try {
    if (req.user._id !== req.params.instructorId && req.user._id !== req.body.instructorId)
      return res.status(401).json({
        success: false,
        messagE: 'Unauthorized',
        data: null
      });
    next();
  }
  catch(error) {
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
  isCurrentInstructor
}