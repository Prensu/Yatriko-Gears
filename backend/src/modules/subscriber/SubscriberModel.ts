import mongoose from "mongoose"

/** Lead-capture modal emails (15% offer). */
const SubscriberSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, unique: true, lowercase: true },
    source: { type: String, default: "lead-capture-modal" },
  },
  { autoCreate: true, autoIndex: true, timestamps: true },
)

export default mongoose.model("Subscriber", SubscriberSchema)
