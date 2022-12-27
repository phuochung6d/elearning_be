import User from '../models/user';
import chalk from 'chalk'

const isEligibleInsMembership = async (userId) => {
  try {
    const user = await User.findById(userId).select('-password -passwordResetCode');

    const nowTimestamp = dayjs().valueOf();
    const [plan_type, plan_start] = [user.instructor_information.plan_type, user.instructor_information.plan_start];

    let expiresIn = 0;
    if (plan_type === 'silver')
      expiresIn = dayjs(plan_start).add(3, 'month');
    else if (plan_type === 'gold')
      expiresIn = dayjs(plan_start).add(6, 'month');
    else if (plan_type === 'premium')
      expiresIn = dayjs(plan_start).add(1, 'year');

    if (nowTimestamp <= expiresIn)
      return true;
    else {
      return false;

      // return res.status(400).json({
      //   success: false,
      //   message: 'Your membership is invalid, can not operate this task',
      //   data: null
      // })
    }
  }
  catch (error) {
    return false;
  }
};

const checkMembership = async (userId) => {
  try {
    const user = await User.findById(userId).select('-password -passwordResetCode');

    if (user?.instructor_information?.plan_start) {
      const nowTimestamp = dayjs().valueOf();
      const [plan_type, plan_start] = [user.instructor_information.plan_type, user.instructor_information.plan_start];

      let expiresIn = 0;
      if (plan_type === 'silver')
        expiresIn = dayjs(plan_start).add(3, 'month');
      else if (plan_type === 'gold')
        expiresIn = dayjs(plan_start).add(6, 'month');
      else if (plan_type === 'premium')
        expiresIn = dayjs(plan_start).add(1, 'year');

      if (nowTimestamp <= expiresIn)
        return 'eligible';
      else
        return 'expired';
    } else {
      return 'not';
    }
  }
  catch (error) {
    console.log('error: ', error);
    return false;
  }
}

export {
  isEligibleInsMembership,
  checkMembership,
}