import dateFormat from 'dateformat';
import querystring from 'qs';
import crypto from 'crypto';

const createPayment = async (req, res, next) => {
  var date = new Date();
  var ipAddr = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
  var tmnCode = process.env.vnp_TmnCode;
  var secretKey = process.env.vnp_HashSecret;
  var vnpUrl = process.env.vnp_Url;
  var returnUrl = process.env.vnp_ReturnUrl;
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
  vnp_Params['vnp_Version'] = '2.1.0';
  vnp_Params['vnp_Command'] = 'pay';
  vnp_Params['vnp_TmnCode'] = tmnCode;
  // vnp_Params['vnp_Merchant'] = ''
  vnp_Params['vnp_Locale'] = locale;
  vnp_Params['vnp_CurrCode'] = currCode;
  vnp_Params['vnp_TxnRef'] = orderId;
  vnp_Params['vnp_OrderInfo'] = orderInfo;
  vnp_Params['vnp_OrderType'] = orderType;
  vnp_Params['vnp_Amount'] = amount * 100;
  vnp_Params['vnp_ReturnUrl'] = returnUrl;
  vnp_Params['vnp_IpAddr'] = ipAddr;
  vnp_Params['vnp_CreateDate'] = createDate;
  // if (bankCode !== null && bankCode !== '') vnp_Params['vnp_BankCode'] = bankCode

  vnp_Params = sortObject(vnp_Params);

  var signData = querystring.stringify(vnp_Params, { encode: false });
  var hmac = crypto.createHmac("sha512", secretKey);
  var signed = hmac.update(new Buffer(signData, 'utf-8')).digest("hex");
  vnp_Params['vnp_SecureHash'] = signed;
  vnpUrl += '?' + querystring.stringify(vnp_Params, { encode: false });

  // res.redirect(vnpUrl)
  res.status(200).json({ vnpUrl: vnpUrl });
};

const getvnP_IPN = async (req, res, next) => {
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

    var orderId = vnp_Params['vnp_TxnRef'];
    var rspCode = vnp_Params['vnp_ResponseCode'];

    //Kiem tra du lieu co hop le khong, cap nhat trang thai don hang va gui ket qua cho VNPAY theo dinh dang duoi
    // res.status(200).json({RspCode: '00', Message: 'success'});
    res.redirect('http://localhost:3000/stripe/success/fe3450da-c2c2-4431-9efd-e54c03f58232')
  }
  else {
    res.status(200).json({ RspCode: '97', Message: 'Fail checksum' })
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

export {
  createPayment,
  getvnP_IPN,
}