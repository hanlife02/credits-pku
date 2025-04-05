"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// backend/src/api/auth.routes.ts
const express_1 = require("express");
const auth_controller_1 = require("../controllers/auth.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const router = (0, express_1.Router)();
// Renamed: Initiates registration, sends code
router.post("/register", auth_controller_1.AuthController.startRegistration); // Changed handler
// New: Verifies the code and completes registration
router.post("/verify-email", auth_controller_1.AuthController.verifyEmail);
// Existing routes
router.post("/login", auth_controller_1.AuthController.login);
router.get("/me", auth_middleware_1.protect, auth_controller_1.AuthController.getMe);
router.put("/complete-onboarding", auth_middleware_1.protect, auth_controller_1.AuthController.completeOnboarding);
exports.default = router;
