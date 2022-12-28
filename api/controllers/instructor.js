import User from "../models/user";
import Stripe from 'stripe';
import queryString from 'query-string';
import dayjs from "dayjs";
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

const becomeInstructor = async (req, res) => {
  try {
    console.log('stripe sk: ', process.env.STRIPE_SECRET_KEY);
    
    // 1. find user from db
    const user = await User.findById(req.user._id);
    if (!user)
      return res.status(204).json({
        success: false,
        message: 'No info for this email of user',
        data: null
      });

    // 2. if user doesn't have stripe_account_id yet, then create new
    if (!user.stripe_account_id) {
      const account = await stripe.accounts.create({ type: 'express' }, {apiKey: process.env.STRIPE_SECRET_KEY});
      user.stripe_account_id = account.id;
      user.save();
    }

    // 3. create account link based on stripe_account_id (for FE to complete onboarding)
    const stripe_redirect_url = process.env.NODE_ENV === 'development'
      ? process.env.STRIPE_REDIRECT_URL_DEV
      : process.env.STRIPE_REDIRECT_URL_PROD;

    let accountLink = await stripe.accountLinks.create({
      account: user.stripe_account_id,
      refresh_url: stripe_redirect_url,
      return_url: stripe_redirect_url,
      type: 'account_onboarding'
    }, {apiKey: process.env.STRIPE_SECRET_KEY});

    // 4. pre-fill any info such email (option), then send URL response to FE
    // accountLink = Object.assign(accountLink, {
    //   "stripe_user[email]": user.email,
    // })

    // 5. then send account link as response to FE
    res.status(200).json({
      success: true,
      message: 'OK',
      data: {
        account_link: `${accountLink.url}?${queryString.stringify(accountLink)}`
      }
    });
  }
  catch (error) {
    console.log('error');
    console.log(error);
  }
}

const getAccountStatus = async (req, res) => {
  try {
    console.log('req.user')
    console.log(req.user);
    const user = await User.findById(req.user._id);
    const stripeAccount = await stripe.accounts.retrieve(user.stripe_account_id);

    // if user haven't set up stripe account completely
    if (!stripeAccount.charges_enabled) {
      return res.status(400).json({
        success: false,
        message: 'Unauthorized',
        data: null
      });
    }

    const statusUpdated = await User.findByIdAndUpdate(req.user._id,
      {
        stripe_seller: stripeAccount,
        $addToSet: { role: 'Instructor' }
      },
      {
        new: true
      }
    )
    .select('-password');

    res.status(200).json({
      success: true,
      message: 'Linked to Stripe !',
      data: statusUpdated
    })
  }
  catch(error) {
    console.log(error);
    return res.status(400).json({
      success: false,
      message: error,
      data: null
    })
  }
}

const getCurrentInstructor = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    if (!user)
      return res.status(403).json({
        success: false,
        message: 'Not found this user',
        data: null
      });

    if (!user.role.includes('Instructor'))
      return res.status(403).json({
        success: false,
        message: 'Forbidden',
        data: null
      });
    else
      return res.status(200).json({
        success: true,
        message: 'Get current instructor successfully',
        data: user
      })
  }
  catch(error) {
    console.log(error);
    return res.status(400).json({
      success: false,
      message: `Something went wrong. ${error.message}`,
      data: null
    })
  }
}

const becomeInstructor2 = async (req, res) => {
  try {
    const { summary, yoe, position, social_linkedin, social_twitter, userId } = req.body.value;

    const user = await User.findByIdAndUpdate(
      userId,
      {
        instructor_information: {
          summary,
          position,
          yoe,
          social: {
            linkedin: social_linkedin,
            twitter: social_twitter,
          }
        },
        $addToSet: { role: 'Instructor' }
      },
      { new: true }
    ).select('-password -passwordResetCode');

    if (!user) 
      return res.status(400).json({
        success: false,
        message: `Something went wrong while registering Instructor. ${error.message}`,
        data: null
      });

    return res.status(200).json({
      success: true,
      message: 'Registered',
      data: user
    })
  }
  catch(error) {
    console.log(error);
    return res.status(400).json({
      success: false,
      message: `Something went wrong while registering Instructor. ${error.message}`,
      data: null
    })
  }
}

const tempSaveBeforeClickMembership = async (req, res) => {
  try {
    const { type } = req.query;

    const user = await User.findById(req.user._id).select('-password -passwordResetCode');

    user.instructor_information.beforeClickMembership_type = type;

    await user.save();

    return res.status(200).json({
      success: true,
      message: `update temporarily save BeforeClickMembership info successfully`,
      data: user
    });
  }
  catch (error) {
    console.log(error);
    return res.status(400).json({
      success: false,
      message: `Something went wrong while temporarily save BeforeClickMembership info. ${error.message}`,
      data: null
    })
  }
}

const updateIntructorMembershipInfo = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password -passwordResetCode');

    const { beforeClickMembership_type } = user.instructor_information;
    if (!beforeClickMembership_type)
      return res.status(400).json({
        success: false,
        message: `Not found beforeClickMembership_type, try again.`,
        data: null
      });

    user.instructor_information.beforeClickMembership_type = '';
    user.instructor_information.plan_type = beforeClickMembership_type;
    user.instructor_information.plan_start = dayjs().valueOf();

    await user.save();

    return res.status(200).json({
      success: true,
      message: `update Intructor Membership Info successfully`,
      data: user
    });
  }
  catch(error) {
    console.log(error);
    return res.status(400).json({
      success: false,
      message: `Something went wrong while updatinf Instructor membership info. ${error.message}`,
      data: null
    })
  }
}

export {
  becomeInstructor,
  getAccountStatus,
  getCurrentInstructor,
  becomeInstructor2,
  tempSaveBeforeClickMembership,
  updateIntructorMembershipInfo,
}