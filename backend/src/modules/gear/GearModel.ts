import mongoose from "mongoose"
import { ImageSchema, StatusSchema, UserRefSchema } from "../../utilities/commonSchema"

/**
 * NOTE: `isNew` is a reserved pathname in Mongoose, so the "new arrival"
 * flag is stored as `isNewArrival` and serialized back to `isNew` in
 * public responses (see toPublicGear in GearController).
 */
const GearSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, minlength: 2, maxlength: 120 },
    slug: { type: String, required: true, unique: true },
    description: { type: String, default: "" },
    realPrice: { type: Number, required: true, min: 0 },
    discountedPrice: { type: Number, required: true, min: 0 },
    availableFor: { type: [String], enum: ["rent", "sale"], default: ["rent"] },
    colors: { type: [String], default: [] },
    specs: { type: Map, of: String, default: {} },
    image: ImageSchema,
    category: { type: mongoose.Schema.Types.ObjectId, ref: "Category", default: null },
    /** Units the shop physically owns — the ceiling for overlapping rentals. */
    quantityTotal: { type: Number, default: 1, min: 0 },
    isNewArrival: { type: Boolean, default: false },
    status: StatusSchema,
    createdBy: UserRefSchema,
    updatedBy: UserRefSchema,
  },
  { autoCreate: true, autoIndex: true, timestamps: true },
)

export default mongoose.model("Gear", GearSchema)
