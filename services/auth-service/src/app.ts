import express, { Application, Request, Response } from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import cookieParser from "cookie-parser";
import session from "express-session";
import * as dotenv from "dotenv";

dotenv.config();

import authRoutes from "./routes/auth.routes";
import passport from "./config/passport";

const app: Application = express();

app.use(helmet());
app.use(cors());
app.use(morgan("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// ─── Session Middleware ────────────────────────────────────────────────────────
// Passport needs this to temporarily store OAuth state during the redirect dance.
// Once the handshake completes and we issue a JWT, the session is no longer used.
app.use(
  session({
    secret: process.env.SESSION_SECRET || "syncspace-session-secret",
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === "production",
      maxAge: 60000, // 1 minute — just long enough for the OAuth handshake
    },
  })
);

// ─── Passport Middleware ───────────────────────────────────────────────────────
// Initialize Passport and restore authentication state from session
app.use(passport.initialize());
app.use(passport.session());

// ─── Routes ───────────────────────────────────────────────────────────────────

app.get("/health", (req: Request, res: Response) => {
  res.status(200).json({
    status: "ok",
    service: "auth-service",
    timeStamp: new Date().toISOString(),
  });
});

app.use("/api/auth", authRoutes);

app.use((req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    message: `Routes ${req.method} ${req.url} not found`,
  });
});

export default app;