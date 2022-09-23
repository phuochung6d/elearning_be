import User from "../models/user";
import { hashPassword, comparePassword } from "../auth/auth";
import jwt from 'jsonwebtoken';

const register = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password)
      return res.status(400).json({
        success: false,
        message: `Make sure you've filled in all of name, email and password`,
        data: null
      });

    const isExisted = await User.findOne({ email });
    if (isExisted)
      return res.status(409).json({
        success: false,
        message: 'Email provided is taken, please use another one',
        data: null
      });

    const hashedPass = await hashPassword(password);

    const user = new User({ name, email, password: hashedPass });

    await user.save();

    return res.status(201).json({
      sucess: true,
      message: 'User is created',
      data: { name, email }
    })
  }
  catch (error) {
    console.log(error)

    return res.status(400).json({
      success: false,
      message: 'Please try again',
      data: null
    })
  }
}

const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // 1) check if email exists
    const user = await User.findOne({ email });
    if (!user)
      return res.status(400).json({
        success: false,
        message: 'No user found',
        data: null
      })

    // 2) compare
    const isMatched = await comparePassword(password, user.password);
    if (!isMatched)
      return res.status(400).json({
        success: false,
        message: 'Wrong password',
        data: null
      })

    // 3) sign jwt
    const token = jwt.sign(
      { _id: user._id },
      process.env.JWT_SECRET,
      // { expiresIn: '7d' }
      { expiresIn: 60 }
    );

    // 4) return user and token to client, exclude the password
    user.password = undefined;
    res.cookie('token', token, {
      httpOnly: true,
      // secure: true  //only https
    });
    return res.status(200).json({
      success: true,
      message: 'Login success',
      data: user
    })
  }
  catch (error) {
    console.log(error);
    return res.status(400).json({
      success: false,
      message: 'Please try again',
      data: null
    })
  }
}

const logout = async (req, res) => {
  try {
    res.clearCookie('token');

    return res.status(200).json({
      success: true,
      message: 'Logout success',
      data: null
    })
  }
  catch (error) {
    console.log(error);
    return res.status(400).json({
      success: false,
      message: 'Please try again',
      data: null
    })
  }
}

const getCurrentUser = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    console.log('CURRENT USER', user);
    return res.status(200).json({
      success: true,
      message: 'Get current user successfully',
      data: user
    })
  }
  catch (error) {
    console.log(error);
  }
}

export { register, login, logout, getCurrentUser }