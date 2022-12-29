import User from "../models/user";
import { hashPassword, comparePassword } from "../../utils/auth";
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

    // 1) validate
    if (!name || !email || !password)
      return res.status(400).json({
        success: false,
        message: `Make sure you've filled in all of name, email and password`,
        data: null
      });

    // 2) check existence
    const isExisted = await User.findOne({ email });
    if (isExisted)
      return res.status(409).json({
        success: false,
        message: 'Email provided is taken, please use another one',
        data: null
      });

    // 3) hash password
    const hashedPass = await hashPassword(password);

    // 4) create user
    const user = new User({ name, email, password: hashedPass });

    // await user.save();

    // 5) prepare email
    let activate_link = process.env.NODE_ENV === 'development'
      ? process.env.CLIENT_URL_DEV
      : process.env.CLIENT_URL_PROD;
    
    const active_code = nanoid(6).toUpperCase();

    activate_link += `/activation/${active_code}`;
    console.log('activate_link: ', activate_link);

    // 6) save user
    user.active_code = active_code;

    await user.save();

    // 7) send email
    const emailParams = {
      Source: process.env.EMAIL_FROM,
      Destination: {
        ToAddresses: [email]
      },
      ReplyToAddresses: [process.env.EMAIL_FROM],
      Message: {
        Subject: {
          Charset: 'UTF-8',
          Data: 'nextgoal | Account activation link'
        },
        Body: {
          Html: {
            Charset: 'UTF-8',
            Data: `
              <html>
                <body>
                  <h2>nextgoal</h2>
                  <h1>Here is your account activation link</h1>
                  <p>Please click to activate your account</p>
                  <p>Here is your link: ${activate_link}</p>
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
        message: 'Sent activation link email',
        data: sentEmail
      })
    });
    sentEmail.catch(error => {
      console.log(error);
      return res.status(200).json({
        success: false,
        message: 'Something wrong while doing sending activation link mail',
        data: null
      });
    })

    // return res.status(201).json({
    //   sucess: true,
    //   message: 'User is created',
    //   data: { name, email }
    // })
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

const checkActivation = async (req, res) => {
  try {
    const { active_code } = req.body;

    const user = await User.findOne({
      active_code
    }).select('-password -passwordResetCode');

    if (!user)
      return res.status(400).json({
        success: false,
        message: 'Not found code',
        data: null
      });

    user.active = true;
    user.active_code = '';

    await user.save();

    return res.status(200).json({
      success: true,
      message: 'Successfully activate this account, please sign in again',
      data: user
    })
  }
  catch (error) {
    console.log(error);
    return res.status(400).json({
      success: false,
      message: 'Check activation false, Please try again',
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

    // 3) check is active
    if (!user.active)
      return res.status(400).json({
        success: false,
        message: `This user hasn't been activated yet`,
        data: null
      })

    // 4) sign jwt
    const token = jwt.sign(
      { _id: user._id },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
      // { expiresIn: 60 }
    );

    // 5) return user and token to client, exclude the password
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
          Data: 'nextgoal | Password reset link'
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
        message: 'Sent reset password mail',
        data: sentEmail
      });
    });
    sentEmail.catch(error => {
      console.log(error);
      return res.status(200).json({
        success: false,
        message: 'Something wrong while doing sending reset password mail',
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

export { register, checkActivation, login, logout, getCurrentUser, requestResetPasswordCode, resetPassword }