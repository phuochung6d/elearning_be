import User from "../models/user";
import { hashPassword, comparePassword } from "../utils/auth";
import jwt from 'jsonwebtoken';
import aws from 'aws-sdk';
import { nanoid } from 'nanoid'

const awsConfig = {
  accessKeyId: process.env.AWS_IAM_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_IAM_SECRET_ACCESS_KEY,
  region: process.env.AWS_IAM_REGION,
  apiVersion: process.env.AWS_IAM_SES_API_VERSION
}

const ses = new aws.SES(awsConfig);

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
      { expiresIn: '7d' }
      // { expiresIn: 60 }
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
    return res.status(403).json({
      success: false,
      message: 'Failed get current user',
      data: null
    })
  }
}

const requestResetPasswordCode = async (req, res) => {
  const { email } = req.body;

  // create nanoid
  const resetCode = nanoid(6).toUpperCase();

  // find & update resetCode of user
  const user = await User.findOneAndUpdate(
    { email },
    { passwordResetCode: resetCode }
  );
  if (!user)
    return res.status(204).json({
      success: false,
      message: 'No user found with this email',
      data: null
    });

  // prepare email
  try {
    const emailParams = {
      Source: process.env.EMAIL_FROM,
      Destination: {
        ToAddresses: [email]
      },
      ReplyToAddresses: [process.env.EMAIL_FROM],
      Message: {
        Subject: {
          Charset: 'UTF-8',
          Data: 'Password reset link'
        },
        Body: {
          Html: {
            Charset: 'UTF-8',
            Data: `
              <html>
                <body>
                  <h2>nextgoal</h2>
                  <h1>Password Reset Link</h1>
                  <p>Here is your CODE: ${resetCode}</p>
                </body>
              </html>
            `
          }
        }
      }
    };

    const sentEmail = ses.sendEmail(emailParams).promise();

    sentEmail.then(data => {
      return res.status(200).json({
        success: true,
        message: 'Sent email',
        data: sentEmail
      });
    });
    sentEmail.catch(error => {
      console.log(error);
      return res.status(200).json({
        success: false,
        message: 'Something wrong while doing sending mail',
        data: null
      });
    })

    // return res.status(200).json({
    //   success: true,
    //   message: 'Sent email',
    //   data: 'aa'
    // });
  }
  catch (error) {
    console.log(error);
    return res.status(400).json({
      success: false,
      message: 'Something went wrong',
      data: null
    });
  }
}

const resetPassword = async (req, res) => {
  const { email, code, newPassword } = req.body;
  console.table({ email, code, newPassword });

  try {
    const hashedPass = await hashPassword(newPassword);

    const user = await User.findOneAndUpdate(
      { email, passwordResetCode: code },
      {
        passwordResetCode: '',
        password: hashedPass
      }
    );
    if (!user)
      return res.status(204).json({
        success: false,
        message: 'Code is wrong',
        data: null
      });

    user.password = undefined;
    user.passwordResetCode = undefined;

    return res.status(200).json({
      success: true,
      message: 'Reset password successfully',
      data: user
    })
  }
  catch (error) {
    console.log(error);
    return res.status(400).json({
      success: false,
      message: 'Something went wrong',
      data: null
    });
  }
}

export { register, login, logout, getCurrentUser, requestResetPasswordCode, resetPassword }