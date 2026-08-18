import mongoose from "mongoose"
import { StatusSchema, UserRefSchema } from "../../utilities/commonSchema"

const PackageSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, minlength: 2, maxlength: 120 },
    slug: { type: String, required: true, unique: true },
    price: { type: Number, required: true, min: 0 },
    items: { type: [String], default: [] },
    description: { type: String, default: "" },
    status: StatusSchema,
    createdBy: UserRefSchema,
    updatedBy: UserRefSchema,
  },
  { autoCreate: true, autoIndex: true, timestamps: true },
)

export default mongoose.model("Package", PackageSchema)
