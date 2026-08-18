import mongoose from "mongoose"

/** Revocable session store — JWT alone is not enough to log users out. */
const AuthSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    accessToken: { type: String, required: true, index: true },
    refreshToken: { type: String, required: true, index: true },
    status: { type: String, enum: ["active", "revoked"], default: "active" },
    agent: { type: String, default: "web" },
  },
  { autoCreate: true, autoIndex: true, timestamps: true },
)

export default mongoose.model("Auth", AuthSchema)
