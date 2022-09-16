// import { readdirSync } from 'fs';
import express from 'express';
import dotenv from 'dotenv';
import morgan from 'morgan';
import cors from 'cors';
import mongoose from 'mongoose';
import authRouter from './routes/auth.js';

dotenv.config();

const app = express();

mongoose.connect(process.env.DATABASE)
  .then(() => console.log('DB connected'))
  .catch(() => console.log('Connect to DB error'))

app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

// readdirSync('./routes').map(route => {
//   app.use(
//     `/api`,
//     require(`./routes/${route}`)
//   );
// });

app.use('/api/auth', authRouter);

const port = process.env.PORRT || 8000;

app.listen(port, () => console.log(`Listening on port ${port}...!`))
