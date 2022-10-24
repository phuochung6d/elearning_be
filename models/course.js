import mongoose from "mongoose";
import { v4 as uuidv4 } from 'uuid';
import dayjs from "dayjs";

const { ObjectId } = mongoose.Schema;

const lessonSchema = new mongoose.Schema(
  {
    _id: {
      type: String,
      required: true,
      default: uuidv4
    },
    title: {
      type: String,
      trim: true,
      minLength: 3,
      maxLength: 500,
      required: true
    },
    slug: {
      type: String,
      lowercase: true,
    },
    content: {
      type: {},
      minLength: 200,
    },
    video_link: {},
    duration: {
      type: Number,
      default: 0
    },
    free_preview: {
      type: Boolean,
      default: false
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

const courseSchema = new mongoose.Schema(
  {
    _id: {
      type: String,
      required: true,
      default: uuidv4
    },
    requirements: {
      type: [String]
    },
    name: {
      type: String,
      trim: true,
      minlength: 3,
      maxlength: 320,
      required: true,
    },
    slug: {
      type: String,
      lowercase: true,
    },
    summary: {
      type: String,
      maxLength: 400,
    },
    goal: {
      type: [String]
    },
    description: {
      type: {},
      minlength: 200,
      required: true,
    },
    image: {},
    category: {
      type: [String]
    },
    price: {
      type: Number,
      default: 9.99,
    },
    paid: {
      type: Boolean,
      default: true,
    },
    instructor: {
      type: String,
      ref: "User",
      required: true,
    },
    lessons: [lessonSchema],
    published: {
      type: Boolean,
      default: false,
    },
    languages: {
      type: [String],
      required: true
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

export default mongoose.model('Course', courseSchema);