"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
// backend/src/services/auth.service.ts
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const db_1 = __importDefault(require("../db"));
const emailValidator_1 = require("../utils/emailValidator");
const email_service_1 = require("./email.service"); // Import EmailService
const crypto_1 = __importDefault(require("crypto")); // For generating random code
const JWT_SECRET = process.env.JWT_SECRET || "DEFAULT_SECRET_CHANGE_ME_IN_ENV";
const CODE_EXPIRY_MINUTES = 15; // Code expires in 15 minutes
exports.AuthService = {
    startRegistration(email, password) {
        return __awaiter(this, void 0, void 0, function* () {
            // 1. Validate Email Format & Domain
            if (!(0, emailValidator_1.isValidPkuEmail)(email)) {
                throw new Error("Invalid email domain. Please use a @pku.edu.cn or @stu.pku.edu.cn address.");
            }
            // 2. Check if a VERIFIED user already exists
            const existingVerifiedUser = yield db_1.default.user.findUnique({
                where: { email },
            });
            if (existingVerifiedUser) {
                throw new Error("An account with this email already exists.");
            }
            // 3. Hash the password
            const salt = yield bcryptjs_1.default.genSalt(10);
            const hashedPassword = yield bcryptjs_1.default.hash(password, salt);
            // 4. Generate a 6-digit verification code
            const code = crypto_1.default.randomInt(100000, 999999).toString(); // Generate 6 digits
            // 5. Calculate expiry time
            const expiresAt = new Date(Date.now() + CODE_EXPIRY_MINUTES * 60 * 1000);
            // 6. Store/Update the pending verification info
            // Use upsert: create if not exist, update if exists (handles resend attempts)
            yield db_1.default.verificationCode.upsert({
                where: { email },
                update: { code, hashedPassword, expiresAt },
                create: { email, code, hashedPassword, expiresAt },
            });
            // 7. Send the verification email (DO NOT await this if you want faster response, but handle potential errors)
            try {
                yield email_service_1.EmailService.sendVerificationCode(email, code); // Use the email service
            }
            catch (emailError) {
                console.error(`Failed to send verification email to ${email}:`, emailError);
                // Decide on behavior: maybe still return success to user but log the error,
                // or throw an error indicating email sending failed. Throwing is safer initially.
                throw new Error("Failed to send verification email. Please try again later.");
            }
            // 8. Return success message - DO NOT log the user in yet
            return {
                message: `Verification code sent to ${email}. Please check your inbox.`,
            };
        });
    },
    // LOGIN function remains the same - only works for VERIFIED users
    login(email, password) {
        return __awaiter(this, void 0, void 0, function* () {
            // ... (keep existing login logic - it queries the 'users' table)
            const user = yield db_1.default.user.findUnique({ where: { email } });
            if (!user) {
                throw new Error("Invalid credentials or account not verified."); // Update error slightly
            }
            const isMatch = yield bcryptjs_1.default.compare(password, user.passwordHash);
            if (!isMatch) {
                throw new Error("Invalid credentials.");
            }
            const payload = { userId: user.id, email: user.email };
            const token = jsonwebtoken_1.default.sign(payload, JWT_SECRET, { expiresIn: "1d" });
            const { passwordHash: _ } = user, userWithoutPassword = __rest(user, ["passwordHash"]);
            return { token, user: userWithoutPassword };
        });
    },
    // NEW Function: Verify the code and complete registration
    verifyEmailAndCompleteRegistration(email, code) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a, _b;
            // 1. Find the pending verification record
            const verificationRecord = yield db_1.default.verificationCode.findUnique({
                where: { email },
            });
            if (!verificationRecord) {
                throw new Error("Verification request not found. Please start registration again.");
            }
            // 2. Check for expiry
            if (new Date() > verificationRecord.expiresAt) {
                // Delete expired code
                yield db_1.default.verificationCode.delete({ where: { email } });
                throw new Error("Verification code has expired. Please start registration again.");
            }
            // 3. Check if code matches
            if (verificationRecord.code !== code) {
                // Consider adding attempt tracking here to prevent brute-force attacks
                throw new Error("Invalid verification code.");
            }
            // 4. **Success!** Create the actual user
            try {
                const newUser = yield db_1.default.user.create({
                    data: {
                        email: verificationRecord.email,
                        passwordHash: verificationRecord.hashedPassword,
                        hasCompletedSetup: false, // Default setup status
                    },
                });
                // 5. Delete the verification code record *after* successful user creation
                yield db_1.default.verificationCode.delete({ where: { email } });
                // 6. Generate JWT token for immediate login
                const payload = { userId: newUser.id, email: newUser.email };
                const token = jsonwebtoken_1.default.sign(payload, JWT_SECRET, { expiresIn: "1d" });
                // 7. Return user data and token
                const { passwordHash: _ } = newUser, userWithoutPassword = __rest(newUser, ["passwordHash"]);
                return { token, user: userWithoutPassword };
            }
            catch (error) {
                // Handle potential unique constraint violation if user somehow got created between checks
                if (error.code === "P2002" && ((_b = (_a = error.meta) === null || _a === void 0 ? void 0 : _a.target) === null || _b === void 0 ? void 0 : _b.includes("email"))) {
                    // Maybe delete the verification code here too?
                    yield db_1.default.verificationCode
                        .delete({ where: { email } })
                        .catch((delErr) => console.error("Error deleting VC after user creation conflict:", delErr));
                    throw new Error("An account with this email already exists.");
                }
                console.error("Error creating user during verification:", error);
                throw new Error("Failed to complete registration.");
            }
        });
    },
    // getUserById function remains the same
    // UPDATED getUserById function
    getUserById(userId) {
        return __awaiter(this, void 0, void 0, function* () {
            console.log(`--- AuthService.getUserById: 开始查询 userId: ${userId} ---`);
            try {
                const user = yield db_1.default.user.findUnique({
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
            }
            catch (dbError) {
                console.error(`--- AuthService.getUserById: 数据库查询错误:`, dbError);
                throw dbError;
            }
        });
    },
    completeOnboarding(userId, gradTotalCredits) {
        return __awaiter(this, void 0, void 0, function* () {
            // Validation
            if (typeof gradTotalCredits !== "number" ||
                isNaN(gradTotalCredits) ||
                gradTotalCredits < 0) {
                throw new Error("Invalid graduation total credits value.");
            }
            const updatedUser = yield db_1.default.user.update({
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
        });
    },
};
