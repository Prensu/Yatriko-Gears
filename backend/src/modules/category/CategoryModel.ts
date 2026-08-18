import mongoose from "mongoose"
import { ImageSchema, StatusSchema, UserRefSchema } from "../../utilities/commonSchema"

const CategorySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, minlength: 2, maxlength: 100 },
    slug: { type: String, required: true, unique: true },
    description: { type: String, default: null },
    status: StatusSchema,
    image: ImageSchema,
    createdBy: UserRefSchema,
    updatedBy: UserRefSchema,
  },
  { autoCreate: true, autoIndex: true, timestamps: true },
)

export default mongoose.model("Category", CategorySchema)
