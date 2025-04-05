// backend/src/controllers/auth.controller.ts
import { Request, Response } from "express";
import { AuthService } from "../services/auth.service";

interface AuthenticatedRequest extends Request {
  user?: { userId: number; email: string }; // Matches the structure added by 'protect' middleware
}

export const AuthController = {
  // Renamed from 'register'
  async startRegistration(req: Request, res: Response): Promise<void> {
    try {
      const { email, password } = req.body;
      if (!email || !password) {
        res.status(400).json({ message: "Email and password are required." });
        return;
      }
      if (password.length < 6) {
        res
          .status(400)
          .json({ message: "Password must be at least 6 characters long." });
        return;
      }

      // Call the updated service method
      const result = await AuthService.startRegistration(email, password);
      // Send back only the success message
      res.status(200).json(result); // 200 OK is appropriate here, resource not fully created yet
    } catch (error: any) {
      if (
        error.message.includes("Invalid email domain") ||
        error.message.includes("An account with this email already exists") ||
        error.message.includes("Failed to send verification email")
      ) {
        res.status(400).json({ message: error.message });
      } else {
        console.error("Start Registration error:", error);
        res.status(500).json({
          message: "Internal server error during registration initiation.",
        });
      }
    }
  },

  // Login controller remains the same
  async login(req: Request, res: Response): Promise<void> {
    // ... (keep existing login controller logic)
    try {
      const { email, password } = req.body;
      if (!email || !password) {
        /*...*/
      }
      const result = await AuthService.login(email, password);
      res.status(200).json(result);
    } catch (error: any) {
      /*...*/
    }
  },

  // NEW Controller function for verification
  async verifyEmail(req: Request, res: Response): Promise<void> {
    try {
      const { email, code } = req.body;
      if (!email || !code) {
        res
          .status(400)
          .json({ message: "Email and verification code are required." });
        return;
      }
      if (typeof code !== "string" || !/^\d{6}$/.test(code)) {
        res
          .status(400)
          .json({ message: "Verification code must be a 6-digit number." });
        return;
      }

      // Call the new verification service method
      const result = await AuthService.verifyEmailAndCompleteRegistration(
        email,
        code
      );
      // On success, respond with user and token (logged in)
      res.status(201).json({
        ...result,
        message: "Email verified and registration successful.",
      }); // 201 Created
    } catch (error: any) {
      // Handle specific verification errors
      if (
        error.message.includes("Verification request not found") ||
        error.message.includes("Verification code has expired") ||
        error.message.includes("Invalid verification code") ||
        error.message.includes("An account with this email already exists")
      ) {
        // Catch user creation conflict too
        res.status(400).json({ message: error.message });
      } else {
        console.error("Email Verification error:", error);
        res.status(500).json({
          message: "Internal server error during email verification.",
        });
      }
    }
  },

  // getMe controller remains the same
  async getMe(req: AuthenticatedRequest, res: Response): Promise<void> {
    console.log("--- AuthController.getMe: 开始处理 ---"); // <-- 添加日志 7
    const userId = (req as any).user?.userId; // 或者 req.user?.userId 如果类型正确
    console.log("--- AuthController.getMe: 获取到 userId:", userId); // <-- 添加日志 8
    if (!userId) {
      /* ... */
    }
    try {
      console.log("--- AuthController.getMe: 调用 AuthService.getUserById ---"); // <-- 添加日志 9
      const user = await AuthService.getUserById(userId);
      console.log(
        "--- AuthController.getMe: AuthService.getUserById 返回:",
        user
      ); // <-- 添加日志 10
      if (!user) {
        /* ... */
      }
      console.log("--- AuthController.getMe: 发送响应 ---"); // <-- 添加日志 11
      res.status(200).json(user);
    } catch (error) {
      console.error("--- AuthController.getMe 错误:", error); // <-- 添加日志 12
      res.status(500).json({ message: "Internal server error" });
    }
  },
  async completeOnboarding(
    req: AuthenticatedRequest,
    res: Response
  ): Promise<void> {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ message: "Not authenticated" });
      return;
    }

    try {
      const { graduationTotalCredits } = req.body;

      if (
        graduationTotalCredits === undefined ||
        graduationTotalCredits === null
      ) {
        res
          .status(400)
          .json({ message: "Missing required field: graduationTotalCredits" });
        return;
      }
      const numericCredits = Number(graduationTotalCredits);
      if (isNaN(numericCredits) || numericCredits < 0) {
        res
          .status(400)
          .json({ message: "Invalid graduation total credits value." });
        return;
      }

      const updatedUser = await AuthService.completeOnboarding(
        userId,
        numericCredits
      );
      res.status(200).json(updatedUser);
    } catch (error: any) {
      if (error.message.includes("Invalid graduation total credits value.")) {
        res.status(400).json({ message: error.message });
      } else {
        console.error(`Error completing onboarding for user ${userId}:`, error);
        res.status(500).json({
          message: "Internal server error during onboarding completion.",
        });
      }
    }
  },
};
