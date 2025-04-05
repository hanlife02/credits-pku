// backend/src/services/email.service.ts
import nodemailer from "nodemailer";

interface MailOptions {
  to: string;
  subject: string;
  text: string; // Plain text body
  html?: string; // HTML body (optional)
}

export const EmailService = {
  transporter: nodemailer.createTransport({
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

  async sendMail({ to, subject, text, html }: MailOptions): Promise<void> {
    const mailOptions = {
      from: process.env.SMTP_FROM_EMAIL || '"Your App" <no-reply@example.com>', // Sender address
      to: to, // List of receivers
      subject: subject, // Subject line
      text: text, // Plain text body
      html: html, // HTML body (optional)
    };

    try {
      const info = await this.transporter.sendMail(mailOptions);
      console.log("Message sent: %s", info.messageId);
      // You can add more robust logging here
    } catch (error) {
      console.error("Error sending email:", error);
      // Re-throw the error so the calling function knows something went wrong
      throw new Error("Failed to send verification email.");
    }
  },

  async sendVerificationCode(to: string, code: string): Promise<void> {
    const subject = "Your Verification Code";
    const text = `Your verification code is: ${code}\nIt will expire in 15 minutes.`;
    const html = `<p>Your verification code is: <strong>${code}</strong></p><p>It will expire in 15 minutes.</p>`; // Optional HTML version

    await this.sendMail({ to, subject, text, html });
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
