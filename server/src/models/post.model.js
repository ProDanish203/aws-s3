import mongoose, { Schema, model } from "mongoose";

const PostSchema = new Schema(
  {
    image: {
      type: String,
      required: [true, "Image is required"],
    },
    caption: {
      type: String,
      required: [true, "Caption is required"],
    },
  },
  {
    timestamps: true,
  }
);

export const Post = mongoose.models.Post || model("Post", PostSchema);
