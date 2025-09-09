import mongoose, { Schema } from "mongoose";

const paymentSchema = new Schema(
  {
    apartmentId: { type: Schema.Types.ObjectId, ref: "Apartment", required: true },
    tenantId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    amount: { type: Number, required: true },
    date: { type: Date, required: true },
    type: { type: String, enum: ["rent", "maintenance"], required: true },
  },
  { timestamps: true }
);

export const Payment = mongoose.model("Payment", paymentSchema);
