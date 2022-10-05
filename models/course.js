import mongoose from "mongoose";
import { ObjectId } from mongoose.Schema;

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
    pre_preview: {
      type: Boolean,
      default: false
    }
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
    description: {
      type: {},
      minlength: 200,
      required: true,
    },
    image: {},
    category: String,
    price: {
      type: Number,
      default: 9.99,
    },
    paid: {
      type: Boolean,
      default: true,
    },
    instructor: {
      type: ObjectId,
      ref: "User",
      required: true,
    },
    lessons: [lessonSchema],
    published: {
      type: Boolean,
      default: false,
    },
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