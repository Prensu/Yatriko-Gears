import mongoose from "mongoose"

const ContactSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, minlength: 2, maxlength: 80 },
    email: { type: String, required: true },
    phone: { type: String, required: true },
    subject: { type: String, required: true, maxlength: 120 },
    message: { type: String, required: true, maxlength: 2000 },
    status: { type: String, enum: ["new", "read", "resolved"], default: "new" },
  },
  { autoCreate: true, autoIndex: true, timestamps: true },
)

export default mongoose.model("Contact", ContactSchema)
