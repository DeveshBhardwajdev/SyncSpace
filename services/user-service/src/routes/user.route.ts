import { Router } from "express";
import { getProfile, updateProfile, uploadAvatar } from "../controllers/user.controller";
import { authGuard } from "../middleware/auth.middleware";
import { upload } from "../middleware/upload.middleware";

const router: Router = Router();
// All routes below require a valid JWT (authGuard runs first on every route here)
router.get("/me", authGuard, getProfile);
router.put("/me", authGuard, updateProfile);
router.post("/me/avatar", authGuard, upload.single("avatar"), uploadAvatar);

export default router;