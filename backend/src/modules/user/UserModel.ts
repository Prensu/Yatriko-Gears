import mongoose from "mongoose"
import { ImageSchema } from "../../utilities/commonSchema"

const UserSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, minlength: 2, maxlength: 50 },
    email: { type: String, required: true, unique: true, lowercase: true },
    /**
     * Google accounts never set a password and Google doesn't share a phone
     * number, so both are only required for locally-registered users. The
     * phone is collected later, at booking time.
     */
    password: {
      type: String,
      required: function (this: { provider?: string }) {
        return this.provider !== "google"
      },
    },
    phone: {
      type: String,
      required: function (this: { provider?: string }) {
        return this.provider !== "google"
      },
    },
    provider: { type: String, enum: ["local", "google"], default: "local" },
    googleId: { type: String, default: null },
    /** Google's profile picture URL — plain string, unlike the multer sub-doc. */
    avatarUrl: { type: String, default: null },
    role: { type: String, enum: ["customer", "admin"], default: "customer" },
    address: { type: String, default: null },
    image: ImageSchema,
  },
  { autoCreate: true, autoIndex: true, timestamps: true },
)

export default mongoose.model("User", UserSchema)
