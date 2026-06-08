import passport from "passport";

import {
    Strategy as GoogleStrategy ,
    Profile as GoogleProfile ,
} from "passport-google-oauth20"

import {
    Strategy as GithubStrategy ,
    Profile as GithubProfile ,
} from "passport-github2"

import { VerifyCallback } from "passport-google-oauth20";

import User from "../models/user.model";

// --- Google Strategy --------------------------------------------------

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      callbackURL: process.env.GOOGLE_CALLBACK_URL!,
    },
    async (
      accessToken: string,
      refreshToken: string,
      profile: GoogleProfile,
      done: VerifyCallback
    ) => {
      try {
        // Step 1: Extract the user's email from their Google profile
        const email = profile.emails?.[0]?.value;

        if (!email) {
          return done(new Error("No email found in Google profile"), undefined);
        }

        // Step 2: Check if this user already exists in MongoDB
        // We search by provider + providerId — the safest way to identify OAuth users
        let user = await User.findOne({
          provider: "google",
          providerId: profile.id,
        });

        // Step 3: If they exist, they are a returning user — just return them
        if (user) {
          return done(null, user);
        }

        // Step 4: Check if someone already registered with this email using password
        const existingEmailUser = await User.findOne({ email });

        if (existingEmailUser) {
          // This email exists but was registered with a password
          // We link the Google account to it instead of creating a duplicate
          existingEmailUser.provider = "google";
          existingEmailUser.providerId = profile.id;
          existingEmailUser.isVerified = true;
          await existingEmailUser.save();
          return done(null, existingEmailUser);
        }

        // Step 5: Brand new user — create them automatically
        const newUser = await User.create({
          name: profile.displayName || "Google User",
          email,
          provider: "google",
          providerId: profile.id,
          isVerified: true,       // OAuth users are pre-verified by Google
          role: "candidate",
        });

        return done(null, newUser);
      } catch (error) {
        return done(error as Error, undefined);
      }
    }
  )
);

// ---- Github Strategy ------------------------------------

passport.use(
  new GithubStrategy(
    {
      clientID: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
      callbackURL: process.env.GITHUB_CALLBACK_URL!,
      scope: ["user:email"],    // Ask GitHub specifically for the user's email
    },
    async (
      accessToken: string,
      refreshToken: string,
      profile: GithubProfile,
      done: VerifyCallback
    ) => {
      try {
        // Step 1: Extract email — GitHub may return multiple, take the first
        const email = profile.emails?.[0]?.value;

        if (!email) {
          return done(
            new Error(
              "No email found in GitHub profile. Please make your GitHub email public."
            ),
            undefined
          );
        }

        // Step 2: Check if this GitHub user already exists
        let user = await User.findOne({
          provider: "github",
          providerId: profile.id,
        });

        // Step 3: Returning user — just return them
        if (user) {
          return done(null, user);
        }

        // Step 4: Check if this email exists from a password registration
        const existingEmailUser = await User.findOne({ email });

        if (existingEmailUser) {
          existingEmailUser.provider = "github";
          existingEmailUser.providerId = profile.id;
          existingEmailUser.isVerified = true;
          await existingEmailUser.save();
          return done(null, existingEmailUser);
        }

        // Step 5: New user — create them automatically
        const newUser = await User.create({
          name: profile.displayName || profile.username || "GitHub User",
          email,
          provider: "github",
          providerId: profile.id,
          isVerified: true,       // OAuth users are pre-verified by GitHub
          role: "candidate",
        });

        return done(null, newUser);
      } catch (error) {
        return done(error as Error, undefined);
      }
    }
  )
);

//  ------- Session Serialization ----------------------

passport.serializeUser((user: any, done) => {
  done(null, user._id);
});

passport.deserializeUser(async (id: string, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

export default passport;