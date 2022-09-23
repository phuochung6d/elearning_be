import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
dotenv.config();

export const requireSignin = (req, res, next) => {
  try {
    console.log('req token', req.headers.cookie.replace('token=', ''));
    const decoded = jwt.verify(req.headers.cookie.replace('token=', ''), process.env.JWT_SECRET);
    console.log('decoded', decoded);
    req.user = decoded;
    next();
  }
  catch(error) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized',
      data: null
    })
    // return res.status(401).json(error);
  }
}

// import { expressjwt } from "express-jwt";
// import dotenv from 'dotenv';
// dotenv.config();

// export const requireSignin = expressjwt({
//   getToken: (req, res) => req.cookies.token,
//   secret: process.env.JWT_SECRET,
//   algorithms: ["HS256"],
// });
