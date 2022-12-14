import dateFormat from 'dateformat';
import querystring from 'qs';
import crypto from 'crypto';
import User from '../models/user';

const createPayment = async (req, res, next) => {
  try {
    var date = new Date();
    var ipAddr = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    var tmnCode = process.env.vnp_TmnCode;
    var secretKey = process.env.vnp_HashSecret;
    var returnUrl = process.env.NODE_ENV === 'development' ? process.env.vnp_ReturnUrl_DEV : process.env.vnp_ReturnUrl_PROD;
    var createDate = dateFormat(date, 'yyyymmddHHmmss');
    var orderId = dateFormat(date, 'HHmmss');
    var amount = req.body.amount;
    // var bankCode = req.body.bankCode || 'NCB';
    var orderInfo = req.body.orderDescription;
    var orderType = 250000;
    var locale = req.body.language;
    if (locale === null || locale === '') locale = 'vn';
    var currCode = 'VND';

    var vnp_Params = {};
    // vnp_Params['vnp_Merchant'] = '';
    // if (bankCode !== null && bankCode !== '') vnp_Params['vnp_BankCode'] = bankCode
    vnp_Params['vnp_Version'] = '2.1.0';
    vnp_Params['vnp_Command'] = 'pay';
    vnp_Params['vnp_TmnCode'] = tmnCode;
    vnp_Params['vnp_Locale'] = locale;
    vnp_Params['vnp_CurrCode'] = currCode;
    vnp_Params['vnp_TxnRef'] = orderId;
    vnp_Params['vnp_OrderInfo'] = orderInfo;
    vnp_Params['vnp_OrderType'] = orderType;
    vnp_Params['vnp_Amount'] = amount * 100;
    vnp_Params['vnp_ReturnUrl'] = returnUrl;
    vnp_Params['vnp_IpAddr'] = ipAddr;
    vnp_Params['vnp_CreateDate'] = createDate;

    // modify data of vnp_Params
    vnp_Params = sortObject(vnp_Params);
    var signData = querystring.stringify(vnp_Params, { encode: false });
    var hmac = crypto.createHmac("sha512", secretKey);
    var signed = hmac.update(new Buffer(signData, 'utf-8')).digest("hex");
    vnp_Params['vnp_SecureHash'] = signed;

    // // add userId to url
    // const vnp_CustomParams['userId']

    // console.log('vnp_Params: ', vnp_Params);

    // create redirect link and send along with userId
    var vnpUrl = process.env.vnp_Url;
    vnpUrl += '?' + querystring.stringify(vnp_Params, { encode: false });

    // res.redirect(vnpUrl)
    res.status(200).json({ vnpUrl: vnpUrl });
  }
  catch (error) {
    console.log(error);
    return res.status(400).json({
      success: false,
      message: `Something went wrong while create payment link with vnpay. ${error.message}`,
      data: {
        shortUrl: 'vnpay/cancel'
      }
    })
  }
};

const getvnP_IPN = async (req, res, next) => {
  try {
    var vnp_Params = req.query;

    var secureHash = vnp_Params['vnp_SecureHash'];

    delete vnp_Params['vnp_SecureHash'];
    delete vnp_Params['vnp_SecureHashType'];

    vnp_Params = sortObject(vnp_Params);

    var secretKey = process.env.vnp_HashSecret;
    var signData = querystring.stringify(vnp_Params, { encode: false });
    var hmac = crypto.createHmac("sha512", secretKey);
    var signed = hmac.update(new Buffer(signData, 'utf-8')).digest("hex");

    if (secureHash === signed) {
      console.log('thanh toan thanh cong! ');
      console.log('req.body: ', req.body);

      var orderId = vnp_Params['vnp_TxnRef'];
      var rspCode = vnp_Params['vnp_ResponseCode'];

      //Kiem tra du lieu co hop le khong, cap nhat trang thai don hang va gui ket qua cho VNPAY theo dinh dang duoi
      // res.status(200).json({RspCode: '00', Message: 'success'});
      res.redirect(
        process.env.NODE_ENV === 'development'
        ? process.env.vnp_SuccessUrl_DEV
        : process.env.NODE_ENV === 'production'
          ? process.env.vnp_SuccessUrl_PROD
          : ''
      );
    }
    else {
      console.log('thanh toan kh??ng thanh cong! ');
      // res.status(200).json({ RspCode: '97', Message: 'Fail checksum' });
      res.redirect(
        process.env.NODE_ENV === 'development'
        ? process.env.vnp_CancelUrl_DEV
        : process.env.NODE_ENV === 'production'
          ? process.env.vnp_CancelUrl_PROD
          : ''
      );
    }
  }
  catch (error) {
    console.log(error);
    return res.status(400).json({
      success: false,
      message: `Something went wrong while create payment link with vnpay. ${error.message}`,
      data: {
        shortUrl: 'vnpay/cancel'
      }
    })
  }
};

const sortObject = (obj) => {
  var sorted = {};
  var str = [];
  var key;
  for (key in obj) {
    if (obj.hasOwnProperty(key)) {
      str.push(encodeURIComponent(key));
    }
  }
  str.sort();
  for (key = 0; key < str.length; key++) {
    sorted[str[key]] = encodeURIComponent(obj[str[key]]).replace(/%20/g, "+");
  }
  return sorted;
}

const checkIsPayForMembership = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).select('-password -passwordResetCode');

    const [plan_type, plan_start] = [
      user.instructor_information.plan_type,
      user.instructor_information.plan_start
    ];

    if (plan_type) {
      const checked = checkValidMembership(plan_type, plan_start);

      if (!checked)
        next();
      else {
        return res.status(400).json({
          success: false,
          message: `You've already paid for this course, please reload page`,
          data: null
        })
      }
    } else {
      next();
    }
  }
  catch(error) {
    console.log(error);
    return res.status(400).json({
      success: false,
      message: `Something went wrong while checking is pay for membership with vnpay. ${error.message}`,
      data: null
    })
  }
}

export {
  checkIsPayForMembership,
  createPayment,
  getvnP_IPN,
}