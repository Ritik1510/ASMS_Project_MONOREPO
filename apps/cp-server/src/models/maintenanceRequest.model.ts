import mongoose, { Schema } from "mongoose";

// --- Maintenance Requests Schema ---
const maintenanceRequestSchema = new Schema(
  {
    apartmentId: { type: Schema.Types.ObjectId, ref: "Apartment", required: true },
    tenantId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    description: { type: String, required: true },
    status: {
      type: String,
      enum: ["pending", "in_progress", "completed", "denied"],
      required: true,
    },
  },
  { timestamps: true }
);

export const MaintenanceRequest = mongoose.model("MaintenanceRequest", maintenanceRequestSchema);