// backend/src/api/auth.routes.ts
import { Router } from "express";
import { AuthController } from "../controllers/auth.controller";
import { protect } from "../middleware/auth.middleware";

const router = Router();

// Renamed: Initiates registration, sends code
router.post("/register", AuthController.startRegistration); // Changed handler

// New: Verifies the code and completes registration
router.post("/verify-email", AuthController.verifyEmail);

// Existing routes
router.post("/login", AuthController.login);
router.get("/me", protect, AuthController.getMe);

router.put("/complete-onboarding", protect, AuthController.completeOnboarding);

export default router;
