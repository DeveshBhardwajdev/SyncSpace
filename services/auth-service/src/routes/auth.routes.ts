import { Router } from "express";
import { register, login, logout, refresh, oauthCallback } from "../controllers/auth.controller";
import { registerValidation, loginValidation, handleValidationError } from "../middleware/validate.middleware";
import { authGuard } from "../middleware/auth.middleware";
import passport from "../config/passport";

const router: Router = Router();

// ─── Existing Routes ───────────────────────────────────────────────────────────

router.post(
  "/register",
  registerValidation,
  handleValidationError,
  register
);

router.post(
  "/login",
  loginValidation,
  handleValidationError,
  login
);

router.post("/logout", logout);
router.post("/refresh", refresh);

router.get("/me", authGuard, (req, res) => {
  res.status(200).json({
    success: true,
    message: "Token is valid",
    data: {
      user: req.user,
    },
  });
});

// ─── Google OAuth Routes ───────────────────────────────────────────────────────

// Step 1: User hits this route → Passport redirects them to Google's login page
router.get(
  "/google",
  passport.authenticate("google", {
    scope: ["profile", "email"],  // Ask Google for the user's name and email
    session: false,               // We use JWT, not sessions
  })
);

// Step 2: Google sends user back here after they approve
// Passport intercepts this, completes the handshake, populates req.user
// Then our oauthCallback controller runs and issues the JWT
router.get(
  "/google/callback",
  passport.authenticate("google", {
    failureRedirect: "/api/auth/google/failure",
    session: false,
  }),
  oauthCallback
);

// ─── GitHub OAuth Routes ───────────────────────────────────────────────────────

// Step 1: User hits this route → Passport redirects them to GitHub's login page
router.get(
  "/github",
  passport.authenticate("github", {
    scope: ["user:email"],        // Ask GitHub specifically for the user's email
    session: false,
  })
);

// Step 2: GitHub sends user back here after they approve
router.get(
  "/github/callback",
  passport.authenticate("github", {
    failureRedirect: "/api/auth/github/failure",
    session: false,
  }),
  oauthCallback
);

// ─── OAuth Failure Routes ──────────────────────────────────────────────────────

// If OAuth fails for any reason, the user lands here
router.get("/google/failure", (req, res) => {
  res.status(401).json({
    success: false,
    message: "Google authentication failed. Please try again.",
  });
});

router.get("/github/failure", (req, res) => {
  res.status(401).json({
    success: false,
    message: "GitHub authentication failed. Please try again.",
  });
});

export default router;