import mongoose from "mongoose"
import { ImageSchema, StatusSchema, UserRefSchema } from "../../utilities/commonSchema"

const DestinationSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, minlength: 2, maxlength: 120 },
    slug: { type: String, required: true, unique: true },
    blurb: { type: String, default: "" },
    image: ImageSchema,
    status: StatusSchema,
    createdBy: UserRefSchema,
    updatedBy: UserRefSchema,
  },
  { autoCreate: true, autoIndex: true, timestamps: true },
)

export default mongoose.model("Destination", DestinationSchema)
