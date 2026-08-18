import mongoose from "mongoose"

/** Reusable mongoose sub-schemas shared across modules. */

export const ImageSchema = {
  url: { type: String },
  path: { type: String },
  filename: { type: String },
  size: { type: Number },
  mimeType: { type: String },
}

export const UserRefSchema = {
  type: mongoose.Schema.Types.ObjectId,
  ref: "User",
  default: null,
}

export const StatusSchema = {
  type: String,
  enum: ["active", "inactive"],
  default: "active",
}
