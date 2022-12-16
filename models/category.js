import mongoose from "mongoose";
import { v4 as uuidv4 } from 'uuid';
import dayjs from "dayjs";

const categorySchema = new mongoose.Schema(
  {
    _id: {
      type: String,
      required: true,
      default: uuidv4
    },
    slug: {
      type: String,
      required: true,
      maxLength: 150
    },
    name: {
      type: String,
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

export default mongoose.model('Category', categorySchema);