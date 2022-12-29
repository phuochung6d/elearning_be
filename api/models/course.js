import mongoose from "mongoose";
import { v4 as uuidv4 } from 'uuid';
import dayjs from "dayjs";

const { ObjectId } = mongoose.Schema;

const quizSchema = new mongoose.Schema(
  {
    _id: {
      type: String,
      required: true,
      default: uuidv4
    },
    lesson: {
      type: String,
      ref: 'lessons',  // wrong because not have Lesson model yet
      required: true
    },
    question: {
      type: String,
      required: true
    },
    answer: [{
      type: Object,
      required: true
    }],
    correctAnswer: [{
      type: Object
    }],
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
    document_link: {},
    video_link: {},
    duration: {
      type: Number,
      default: 0
    },
    free_preview: {
      type: Boolean,
      default: false
    },
    index: Number,
    section: {
      type: String,
      ref: 'sections',  // wrong because not have Section model yet
      required: true,
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

const sectionSchema = new mongoose.Schema(
  {
    _id: {
      type: String,
      required: true,
      default: uuidv4
    },
    index: {
      type: Number,
      default: 0,
    },
    name: {
      type: String,
      default: 'Default name of first section'
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
    category: {
      type: String,
      required: true
    },
    requirements: {
      type: [String],
      default: [],
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
      type: [String],
      default: [],
    },
    description: {
      type: String,
      required: true,
    },
    image: {},
    tags: {
      type: [String],
      default: []
    },
    price: {
      type: Number,
      default: 0,
    },
    paid: {
      type: Boolean,
      default: false,
    },
    instructor: {
      type: String,
      ref: "User",
      required: true,
    },
    sections: [sectionSchema],
    lessons: [lessonSchema],
    quizzes: [quizSchema],
    published: {
      type: Boolean,
      default: false,
    },
    languages: {
      type: [String],
      required: true,
      default: [],
    },
    status: {
      type: String,
      enum: ['unpublic', 'unaccepted', 'rejected', 'public']
    },
    rejected_reasons: [String],
    official_data: {
      type: Object
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