import { Router } from "express";
import { register , login , logout } from "../controllers/auth.controller";
import { registerValidation,loginValidation,handleValidationError } from "../middleware/validate.middleware";

const router:Router = Router();

router.post(
    '/register',
    registerValidation,
    handleValidationError,
    register
);

router.post(
    '/login',
    loginValidation,
    handleValidationError,
    login
);

router.post('/logout', logout);

export default router;