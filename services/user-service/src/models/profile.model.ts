import mongoose, { Schema, Document } from "mongoose";

// This describes the shape of a Profile document in TypeScript
export interface IProfile extends Document {
  userId: string;       // links back to the User document in auth-service (Reference by ID pattern)
  bio: string;
  skills: string[];
  experience: string;
  avatarUrl: string;
  updatedAt: Date;
}

const profileSchema = new Schema<IProfile>(
  {
    userId: {
      type: String,
      required: true,
      unique: true, // one profile per user — no duplicates allowed
      index: true,  // makes lookups by userId fast
    },
    bio: {
      type: String,
      default: "",
      maxlength: 500,
    },
    skills: {
      type: [String], // array of strings, e.g. ["React", "Node.js", "Docker"]
      default: [],
    },
    experience: {
      type: String,
      default: "",
      maxlength: 1000,
    },
    avatarUrl: {
      type: String,
      default: "",
    },
  },
  {
    timestamps: { createdAt: false, updatedAt: true }, // Mongoose auto-manages updatedAt
  }
);

export const Profile = mongoose.model<IProfile>("Profile", profileSchema);