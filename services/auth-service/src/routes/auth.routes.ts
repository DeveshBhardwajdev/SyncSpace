import { Router } from "express";
import { register , login , logout , refresh} from "../controllers/auth.controller";
import { registerValidation,loginValidation,handleValidationError } from "../middleware/validate.middleware";
import { authGuard } from "../middleware/auth.middleware";

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
router.post('/refresh', refresh);

router.get('/me', authGuard, (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Token is valid',
    data: {
      user: req.user,
    },
  });
});

export default router;