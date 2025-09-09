import mongoose, { Schema } from "mongoose";

// --- Announcements Schema ---
const announcementSchema = new Schema(
  {
    title: { type: String, required: true },
    content: { type: String, required: true },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    important: { type: Boolean, default: false },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);
export const Announcement = mongoose.model("Announcement", announcementSchema);