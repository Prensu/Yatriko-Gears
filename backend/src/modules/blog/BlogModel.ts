import mongoose from "mongoose"
import { ImageSchema, StatusSchema, UserRefSchema } from "../../utilities/commonSchema"

const BlogSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, minlength: 2, maxlength: 200 },
    slug: { type: String, required: true, unique: true },
    excerpt: { type: String, required: true, maxlength: 300 },
    coverImage: ImageSchema,
    content: { type: String, required: true, maxlength: 100000 },
    author: { type: String, default: "Yatriko Gears", maxlength: 120 },
    status: StatusSchema,
    publishedAt: { type: Date },
    metaTitle: { type: String, default: "", maxlength: 200 },
    metaDescription: { type: String, default: "", maxlength: 300 },
    createdBy: UserRefSchema,
    updatedBy: UserRefSchema,
  },
  { autoCreate: true, autoIndex: true, timestamps: true },
)

export default mongoose.model("Blog", BlogSchema)
