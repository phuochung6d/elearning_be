import mongoose from 'mongoose';
import { v4 as uuidv4 } from 'uuid';
import dayjs from "dayjs";

const reviewSchema = new mongoose.Schema(
  {
    _id: {
      type: String,
      required: true,
      default: uuidv4
    },
    courseId: {
      type: String,
      ref: 'Course',
      required: true
    },
    userId: {
      type: String,
      ref: 'User',
      required: true
    },
    star: Number,
    content: {
      type: String,
      maxLength: 500
    },
    createdAt: Number,
    updatedAt: Number,
  },
  {
    timestamps: {
      createdAt: 'createdAt',
      updatedAt: 'updatedAt',
      currentTime: () => dayjs().valueOf()
    }
  }
);

export default mongoose.model('Review', reviewSchema);