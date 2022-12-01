import mongoose from "mongoose";
import dayjs from "dayjs";
import { v4 as uuidv4 } from 'uuid';

const { Schema } = mongoose;

const userSchema = new Schema(
  {
    _id: {
      type: String,
      required: true,
      default: uuidv4
    },
    name: {
      type: String,
      trim: true,
      required: true
    },
    email: {
      type: String,
      trim: true,
      required: true,
      unique: true
    },
    password: {
      type: String,
      required: true,
      min: 6,
      max: 64
    },
    picture: {
      type: String,
      default: "/avatar.png"
    },
    role: {
      type: [String],
      default: ['Subscriber'],
      enum: ['Subscriber', 'Instructor', 'Admin']
    },
    createdAt: Number,
    updatedAt: Number,
    passwordResetCode: {
      type: String,
      default: '',
    },
    courses: [{
      _id: false,
      courseId: { type: String, ref: 'Course' },
      completedLessons: { type: [String] },
      completedQuizzes: { type: [String]}
    }],
    stripe_account_id: {},
    stripe_seller: {},
    stripeSession: {}
  },
  {
    timestamps: {
      createdAt: 'createdAt',
      updatedAt: 'updatedAt',
      currentTime: () => dayjs().valueOf()
    }
  }
);

export default mongoose.model('User', userSchema);