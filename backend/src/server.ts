/*
 * @Author: Ethan && ethan@hanlife02.com
 * @Date: 2025-04-05 00:07:50
 * @LastEditors: Ethan && ethan@hanlife02.com
 * @LastEditTime: 2025-04-05 19:04:59
 * @FilePath: /code/university-credits-app/backend/src/server.ts
 * @Description: Main backend server setup for Express application.
 *
 * Copyright (c) 2025 by Ethan, All Rights Reserved.
 */
// backend/src/server.ts

import express, { Express, Request, Response, NextFunction } from "express"; // Added NextFunction for error handler type
import cors from "cors";
import dotenv from "dotenv";
import authRoutes from "./api/auth.routes";
import categoryRoutes from "./api/category.routes";
import courseRoutes from "./api/course.routes";
import statsRoutes from "./api/stats.routes";

dotenv.config(); // Load environment variables from .env file

const app: Express = express();
const port = process.env.BACKEND_PORT || 3002;

// --- Global Middleware ---
app.use(cors()); // Enable Cross-Origin Resource Sharing
app.use(express.json()); // Parse JSON request bodies
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded bodies

// --- Routes ---

// Simple root route for health check / basic confirmation
app.get("/", (req: Request, res: Response) => {
  res.send("Backend Server is Running!");
});

// Mount API routers under specific base paths
app.use("/api/auth", authRoutes); // Authentication routes (register, login, verify, me)
app.use("/api/categories", categoryRoutes); // Category management routes (CRUD)
app.use("/api/courses", courseRoutes);
app.use("/api/stats", statsRoutes);
// --- Future routes will be mounted here ---
// app.use("/api/courses", courseRoutes); // Example for later

// --- Basic Error Handling Middleware ---
// (This should typically be placed *after* all your routes)
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  // Added NextFunction type
  console.error("Unhandled Error:", err.stack); // Log the full error stack
  res.status(500).json({ message: "Something broke!" }); // Send JSON response for errors
});

// --- Start the Server ---
app.listen(port, () => {
  console.log(
    `[server]: Backend server is running at http://localhost:${port}`
  );
});
