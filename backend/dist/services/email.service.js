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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.EmailService = void 0;
// backend/src/services/email.service.ts
const nodemailer_1 = __importDefault(require("nodemailer"));
exports.EmailService = {
    transporter: nodemailer_1.default.createTransport({
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT || "587", 10),
        secure: process.env.SMTP_SECURE === "true", // true for 465, false for other ports (STARTTLS)
        auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
        },
        // Optional: Add TLS options if needed, e.g., for self-signed certs
        // tls: {
        //   rejectUnauthorized: false // Use only for local testing if necessary
        // }
    }),
    sendMail(_a) {
        return __awaiter(this, arguments, void 0, function* ({ to, subject, text, html }) {
            const mailOptions = {
                from: process.env.SMTP_FROM_EMAIL || '"Your App" <no-reply@example.com>', // Sender address
                to: to, // List of receivers
                subject: subject, // Subject line
                text: text, // Plain text body
                html: html, // HTML body (optional)
            };
            try {
                const info = yield this.transporter.sendMail(mailOptions);
                console.log("Message sent: %s", info.messageId);
                // You can add more robust logging here
            }
            catch (error) {
                console.error("Error sending email:", error);
                // Re-throw the error so the calling function knows something went wrong
                throw new Error("Failed to send verification email.");
            }
        });
    },
    sendVerificationCode(to, code) {
        return __awaiter(this, void 0, void 0, function* () {
            const subject = "Your Verification Code";
            const text = `Your verification code is: ${code}\nIt will expire in 15 minutes.`;
            const html = `<p>Your verification code is: <strong>${code}</strong></p><p>It will expire in 15 minutes.</p>`; // Optional HTML version
            yield this.sendMail({ to, subject, text, html });
        });
    },
};
// Optional: Verify SMTP connection on startup (add to server.ts if desired)
// EmailService.transporter.verify(function (error, success) {
//   if (error) {
//     console.error("SMTP Connection Error:", error);
//   } else {
//     console.log("SMTP Server is ready to take messages");
//   }
// });
