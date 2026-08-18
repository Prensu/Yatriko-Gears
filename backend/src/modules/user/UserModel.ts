import mongoose from "mongoose"
import { ImageSchema } from "../../utilities/commonSchema"

const UserSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, minlength: 2, maxlength: 50 },
    email: { type: String, required: true, unique: true, lowercase: true },
    password: { type: String, required: true },
    phone: { type: String, required: true },
    role: { type: String, enum: ["customer", "admin"], default: "customer" },
    address: { type: String, default: null },
    image: ImageSchema,
  },
  { autoCreate: true, autoIndex: true, timestamps: true },
)

export default mongoose.model("User", UserSchema)
