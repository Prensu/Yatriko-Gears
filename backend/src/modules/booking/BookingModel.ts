import mongoose from "mongoose"
import { UserRefSchema } from "../../utilities/commonSchema"

/**
 * A rental booking. Line items snapshot the gear name + price at the time of
 * booking so a later price change never rewrites an old order.
 */
const BookingItemSchema = new mongoose.Schema(
  {
    gear: { type: mongoose.Schema.Types.ObjectId, ref: "Gear", required: true },
    name: { type: String, required: true },
    pricePerDay: { type: Number, required: true, min: 0 },
    quantity: { type: Number, required: true, min: 1 },
  },
  { _id: false },
)

const BookingSchema = new mongoose.Schema(
  {
    // Human-friendly reference the shop can read out over the phone.
    code: { type: String, required: true, unique: true },
    user: { ...UserRefSchema, required: true },

    // Contact snapshot — the account can change later, the order should not.
    customerName: { type: String, required: true },
    customerEmail: { type: String, required: true },
    customerPhone: { type: String, required: true },
    deliveryAddress: { type: String, required: true, maxlength: 200 },
    note: { type: String, default: "", maxlength: 500 },

    items: { type: [BookingItemSchema], required: true },

    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    days: { type: Number, required: true, min: 1 },

    subtotal: { type: Number, required: true, min: 0 },
    deliveryCharge: { type: Number, default: 0, min: 0 },
    total: { type: Number, required: true, min: 0 },

    status: {
      type: String,
      enum: ["pending", "confirmed", "active", "completed", "cancelled"],
      default: "pending",
    },

    paymentMethod: { type: String, enum: ["cash"], default: "cash" },
    paymentStatus: { type: String, enum: ["unpaid", "paid", "refunded"], default: "unpaid" },
  },
  { autoCreate: true, autoIndex: true, timestamps: true },
)

export default mongoose.model("Booking", BookingSchema)
