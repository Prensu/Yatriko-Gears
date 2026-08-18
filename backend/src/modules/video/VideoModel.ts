import mongoose from "mongoose"
import { StatusSchema, UserRefSchema } from "../../utilities/commonSchema"

/** Portfolio videos hosted on Cloudinary — we store only URL + publicId. */
const VideoSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, minlength: 2, maxlength: 160 },
    category: { type: String, default: "All" },
    cloudinaryUrl: { type: String, required: true },
    publicId: { type: String, required: true },
    thumbnailUrl: { type: String, default: "" },
    order: { type: Number, default: 0 },
    isFeatured: { type: Boolean, default: false },
    status: StatusSchema,
    createdBy: UserRefSchema,
    updatedBy: UserRefSchema,
  },
  { autoCreate: true, autoIndex: true, timestamps: true },
)

export default mongoose.model("Video", VideoSchema)
