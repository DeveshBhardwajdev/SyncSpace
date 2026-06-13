import { Response } from "express";
import { Profile } from "../models/profile.model";
import { AuthRequest } from "../middleware/auth.middleware";
import cloudinary from "../config/cloudinary";

// GET /api/users/me
export const getProfile = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    // Try to find an existing profile for this user
    let profile = await Profile.findOne({ userId });

    // If none exists yet, create an empty one on the fly
    if (!profile) {
      profile = await Profile.create({ userId });
    }

    return res.status(200).json({ profile });
  } catch (err) {
    console.error("getProfile error:", err);
    return res.status(500).json({ message: "Something went wrong" });
  }
};

// PUT /api/users/me
export const updateProfile = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const { bio, skills, experience } = req.body;

    // Find existing profile, or create a blank one if it doesn't exist
    let profile = await Profile.findOne({ userId });

    if (!profile) {
      profile = new Profile({ userId });
    }

    // Only update fields that were actually provided in the request body
    if (bio !== undefined) {
      profile.bio = bio;
    }

    if (skills !== undefined) {
      // Basic validation: skills should be an array of strings
      if (!Array.isArray(skills)) {
        return res.status(400).json({ message: "skills must be an array of strings" });
      }
      profile.skills = skills;
    }

    if (experience !== undefined) {
      profile.experience = experience;
    }

    await profile.save();

    return res.status(200).json({ profile });
  } catch (err) {
    console.error("updateProfile error:", err);
    return res.status(500).json({ message: "Something went wrong" });
  }
};

// POST /api/users/me/avatar
export const uploadAvatar = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    // Upload the buffer to Cloudinary using a stream
    const uploadResult = await new Promise<{ secure_url: string }>(
      (resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          {
            folder: "syncspace/avatars", // organizes uploads into a folder on Cloudinary
            resource_type: "image",
          },
          (error, result) => {
            if (error || !result) {
              return reject(error || new Error("Upload failed"));
            }
            resolve(result as { secure_url: string });
          }
        );

        // Write our in-memory buffer into the stream, then close it
        stream.end(req.file!.buffer);
      }
    );

    // Find or create the profile, then save the new avatar URL
    let profile = await Profile.findOne({ userId });

    if (!profile) {
      profile = new Profile({ userId });
    }

    profile.avatarUrl = uploadResult.secure_url;
    await profile.save();

    return res.status(200).json({ profile });
  } catch (err) {
    console.error("uploadAvatar error:", err);
    return res.status(500).json({ message: "Something went wrong" });
  }
};