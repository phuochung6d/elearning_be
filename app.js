// import { readdirSync } from 'fs';
import dotenv from 'dotenv';
import express from 'express';
import morgan from 'morgan';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import mongoose from 'mongoose';
import authRouter from './routes/auth';
import instructorRouter from './routes/instructor';
import userRouter from './routes/user';
import courseRouter from './routes/course';

dotenv.config({ path: process.env });

const app = express();

mongoose.connect(process.env.DATABASE)
  .then(() => console.log('DB connected'))
  .catch(() => console.log('Connect to DB error'))

app.use(cors());
app.use(express.json({ limit: '5mb' }));
app.use(cookieParser())
app.use(morgan('dev'));

// readdirSync('./routes').map(route => {
//   app.use(
//     `/api`,
//     require(`./routes/${route}`)
//   );
// });

app.use('/api/auth', authRouter);
app.use('/api/instructor', instructorRouter);
app.use('/api/user', userRouter);
app.use('/api/course', courseRouter);

// app.listen(port, () => console.log(`Listening on port ${port}...!`))

export default app;