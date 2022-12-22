import mongoose from "mongoose";
import dayjs from "dayjs";
import { v4 as uuidv4 } from 'uuid';

const qaSchema = new mongoose.Schema(
  {
    _id: {
      type: String,
      required: true,
      default: uuidv4
    },
    userId: {
      type: String,
      ref: 'User',
      required: true
    },
    courseId: {
      type: String,
      ref: 'Course',
      required: true
    },
    lessonId: {
      type: String,
      // ref: 'Course',
      required: true
    },
    title: {
      type: String,
    },
    content: {
      type: String,
      required: true
    },
    type: {
      type: String,
      enum : ['new','reply'],
    },
    replyQAId: {
      type: String,
      ref: 'QA'
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

export default mongoose.model('QA', qaSchema);