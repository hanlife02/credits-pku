// backend/src/services/auth.service.ts
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import prisma from "../db";
import { User } from "@prisma/client";
import { isValidPkuEmail } from "../utils/emailValidator";
import { EmailService } from "./email.service"; // Import EmailService
import crypto from "crypto"; // For generating random code

const JWT_SECRET = process.env.JWT_SECRET || "DEFAULT_SECRET_CHANGE_ME_IN_ENV";
const CODE_EXPIRY_MINUTES = 15; // Code expires in 15 minutes

export const AuthService = {
  async startRegistration(
    email: string,
    password: string
  ): Promise<{ message: string }> {
    // 1. Validate Email Format & Domain
    if (!isValidPkuEmail(email)) {
      throw new Error(
        "Invalid email domain. Please use a @pku.edu.cn or @stu.pku.edu.cn address."
      );
    }

    // 2. Check if a VERIFIED user already exists
    const existingVerifiedUser = await prisma.user.findUnique({
      where: { email },
    });
    if (existingVerifiedUser) {
      throw new Error("An account with this email already exists.");
    }

    // 3. Hash the password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // 4. Generate a 6-digit verification code
    const code = crypto.randomInt(100000, 999999).toString(); // Generate 6 digits

    // 5. Calculate expiry time
    const expiresAt = new Date(Date.now() + CODE_EXPIRY_MINUTES * 60 * 1000);

    // 6. Store/Update the pending verification info
    // Use upsert: create if not exist, update if exists (handles resend attempts)
    await prisma.verificationCode.upsert({
      where: { email },
      update: { code, hashedPassword, expiresAt },
      create: { email, code, hashedPassword, expiresAt },
    });

    // 7. Send the verification email (DO NOT await this if you want faster response, but handle potential errors)
    try {
      await EmailService.sendVerificationCode(email, code); // Use the email service
    } catch (emailError) {
      console.error(
        `Failed to send verification email to ${email}:`,
        emailError
      );
      // Decide on behavior: maybe still return success to user but log the error,
      // or throw an error indicating email sending failed. Throwing is safer initially.
      throw new Error(
        "Failed to send verification email. Please try again later."
      );
    }

    // 8. Return success message - DO NOT log the user in yet
    return {
      message: `Verification code sent to ${email}. Please check your inbox.`,
    };
  },

  // LOGIN function remains the same - only works for VERIFIED users
  async login(
    email: string,
    password: string
  ): Promise<{ token: string; user: Omit<User, "passwordHash"> }> {
    // ... (keep existing login logic - it queries the 'users' table)
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      throw new Error("Invalid credentials or account not verified."); // Update error slightly
    }
    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      throw new Error("Invalid credentials.");
    }
    const payload = { userId: user.id, email: user.email };
    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: "1d" });
    const { passwordHash: _, ...userWithoutPassword } = user;
    return { token, user: userWithoutPassword };
  },

  // NEW Function: Verify the code and complete registration
  async verifyEmailAndCompleteRegistration(
    email: string,
    code: string
  ): Promise<{ token: string; user: Omit<User, "passwordHash"> }> {
    // 1. Find the pending verification record
    const verificationRecord = await prisma.verificationCode.findUnique({
      where: { email },
    });

    if (!verificationRecord) {
      throw new Error(
        "Verification request not found. Please start registration again."
      );
    }

    // 2. Check for expiry
    if (new Date() > verificationRecord.expiresAt) {
      // Delete expired code
      await prisma.verificationCode.delete({ where: { email } });
      throw new Error(
        "Verification code has expired. Please start registration again."
      );
    }

    // 3. Check if code matches
    if (verificationRecord.code !== code) {
      // Consider adding attempt tracking here to prevent brute-force attacks
      throw new Error("Invalid verification code.");
    }

    // 4. **Success!** Create the actual user
    try {
      const newUser = await prisma.user.create({
        data: {
          email: verificationRecord.email,
          passwordHash: verificationRecord.hashedPassword,
          hasCompletedSetup: false, // Default setup status
        },
      });

      // 5. Delete the verification code record *after* successful user creation
      await prisma.verificationCode.delete({ where: { email } });

      // 6. Generate JWT token for immediate login
      const payload = { userId: newUser.id, email: newUser.email };
      const token = jwt.sign(payload, JWT_SECRET, { expiresIn: "1d" });

      // 7. Return user data and token
      const { passwordHash: _, ...userWithoutPassword } = newUser;
      return { token, user: userWithoutPassword };
    } catch (error: any) {
      // Handle potential unique constraint violation if user somehow got created between checks
      if (error.code === "P2002" && error.meta?.target?.includes("email")) {
        // Maybe delete the verification code here too?
        await prisma.verificationCode
          .delete({ where: { email } })
          .catch((delErr) =>
            console.error(
              "Error deleting VC after user creation conflict:",
              delErr
            )
          );
        throw new Error("An account with this email already exists.");
      }
      console.error("Error creating user during verification:", error);
      throw new Error("Failed to complete registration.");
    }
  },

  // getUserById function remains the same
  // UPDATED getUserById function
  async getUserById(
    userId: number
  ): Promise<Omit<User, "passwordHash"> | null> {
    console.log(`--- AuthService.getUserById: 开始查询 userId: ${userId} ---`);
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          // <--- 仔细检查这部分
          id: true,
          email: true,
          hasCompletedSetup: true,
          graduationTotalCredits: true, // <--- 确保这一行【存在且为 true】
          createdAt: true,
          updatedAt: true,
        },
      });
      console.log(`--- AuthService.getUserById: 查询完成, user:`, user);
      return user; // <--- 这是报错的大致位置 (line 176)
    } catch (dbError) {
      console.error(`--- AuthService.getUserById: 数据库查询错误:`, dbError);
      throw dbError;
    }
  },
  async completeOnboarding(
    userId: number,
    gradTotalCredits: number
  ): Promise<Omit<User, "passwordHash">> {
    // Validation
    if (
      typeof gradTotalCredits !== "number" ||
      isNaN(gradTotalCredits) ||
      gradTotalCredits < 0
    ) {
      throw new Error("Invalid graduation total credits value.");
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        hasCompletedSetup: true,
        graduationTotalCredits: gradTotalCredits,
      },
      select: {
        // Return updated user data without hash
        id: true,
        email: true,
        hasCompletedSetup: true,
        graduationTotalCredits: true,
        createdAt: true,
        updatedAt: true,
      },
    });
    return updatedUser;
  },
};
