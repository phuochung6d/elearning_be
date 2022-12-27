import mongoose from "mongoose";
import { v4 as uuidv4 } from 'uuid';
import dayjs from "dayjs";

const bannerSchema = new mongoose.Schema(
  {
    _id: {
      type: String,
      required: true,
      default: uuidv4
    },
    type: {
      type: String,
      required: true,
      enum: ['home', 'sale', 'category']
    },
    salePosition: { // for type: 'sale'
      type: String,
      enum: ['left', 'right']
    },
    categoryId: { // for type: 'category'
      type: String,
    },
    image: {
      type: Object,
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

export default mongoose.model('Banner', bannerSchema);