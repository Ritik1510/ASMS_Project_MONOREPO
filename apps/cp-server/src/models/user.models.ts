import mongoose, { Schema, Document } from "mongoose";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

// Define a TypeScript interface (optional but good practice)
interface IUser extends Document {
  _id: string;
  fullName: string;
  username: string;
  email: string;
  password: string;
  role: "tenant" | "manager" | "owner" | "visitor" | "security";
  isPasswordCorrect(enteredPassword: string): Promise<boolean>;
  generateAccesstoken(): string;
  generateRefreshtoken(): string;
};

const accessTokenSecret = process.env.ACCESS_TOKEN_SECRET || "default_secret";
const accessTokenExpiry = process.env.ACCESS_TOKEN_EXPIRY || "6h";
const refreshTokenSecret = process.env.REFRESH_TOKEN_SECRET || "default_secret";
const refreshTokenExpiry = process.env.REFRESH_TOKEN_EXPIRY || "7d";

const userSchema = new Schema<IUser>(
  {
    fullName: { type: String, required: true },
    username: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: {
      type: String,
      enum: ["tenant", "manager", "owner", "visitor", "security"],
      required: true,
    },
  },
  { timestamps: true }
);

// Pre-save middleware to hash password
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

// Helper method to check password
userSchema.methods.isPasswordCorrect = async function (
  enteredPassword: string
) {
  return await bcrypt.compare(enteredPassword, this.password);
};

userSchema.methods.generateAccesstoken = function () {
  return jwt.sign(
    {
      _id: this._id,
      email: this.email,
      username: this.username,
      fullName: this.fullName,
    },
    process.env.accessTokenSecret,
    {
      expiresIn: process.env.accessTokenExpiry,
    }
  );
};

userSchema.methods.generateRefreshtoken = function () {
  return jwt.sign(
    {
      _id: this._id,
    },
    process.env.REFRESH_TOKEN_SECRET as string,
    {
      expiresIn: process.env.REFRESH_TOKEN_EXPIRY,
    }
  );
};

// Export model AFTER middleware & methods
export const User = mongoose.model<IUser>("User", userSchema);
