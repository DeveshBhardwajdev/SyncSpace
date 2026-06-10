import { Router } from "express";
import { register, login, logout, refresh, oauthCallback } from "../controllers/auth.controller";
import { registerValidation, loginValidation, handleValidationError } from "../middleware/validate.middleware";
import { authGuard } from "../middleware/auth.middleware";
import { requireRole } from "../middleware/role.middleware";
import { UserRole } from "../models/user.model";
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

// ─── RBAC Test Routes ─────────────────────────────────────────────────────────
// These routes exist purely to verify role enforcement is working correctly
// Auth guard runs first (are you logged in?) then role guard (are you allowed?)

// Only Interviewers can access this
router.get(
  "/test/interviewer-only",
  authGuard,
  requireRole(UserRole.INTERVIEWER),
  (req, res) => {
    res.status(200).json({
      success: true,
      message: "Welcome Interviewer! You have access to this route.",
      data: { user: req.user },
    });
  }
);

// Only Candidates can access this
router.get(
  "/test/candidate-only",
  authGuard,
  requireRole(UserRole.CANDIDATE),
  (req, res) => {
    res.status(200).json({
      success: true,
      message: "Welcome Candidate! You have access to this route.",
      data: { user: req.user },
    });
  }
);

// Both Interviewers and Candidates can access this
router.get(
  "/test/both-roles",
  authGuard,
  requireRole(UserRole.INTERVIEWER, UserRole.CANDIDATE),
  (req, res) => {
    res.status(200).json({
      success: true,
      message: "Welcome! Both roles can access this route.",
      data: { user: req.user },
    });
  }
);

export default router;