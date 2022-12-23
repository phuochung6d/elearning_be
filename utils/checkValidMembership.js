import dayjs from 'dayjs';

const checkValidMembership = (plan_type, plan_start) => {
  try {
    const nowTimestamp = dayjs().valueOf();

    let expiresIn = 0;
    if (plan_type === 'silver')
      expiresIn = dayjs(plan_start).add(3, 'month');
    else if (plan_type === 'gold')
      expiresIn = dayjs(plan_start).add(6, 'month');
    else if (plan_type === 'premium')
      expiresIn = dayjs(plan_start).add(1, 'year');

    if (nowTimestamp <= expiresIn)
      return true;
    else
      return false;
  }
  catch (error) {
    console.log('error while checking validation of membership');
    return false;
  }
};

export {
  checkValidMembership,
}