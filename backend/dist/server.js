"use strict";
/*
 * @Author: Ethan && ethan@hanlife02.com
 * @Date: 2025-04-05 00:07:50
 * @LastEditors: Ethan && ethan@hanlife02.com
 * @LastEditTime: 2025-04-05 18:58:12
 * @FilePath: /code/university-credits-app/backend/dist/server.js
 * @Description: Main backend server setup for Express application.
 *
 * Copyright (c) 2025 by Ethan, All Rights Reserved.
 */
// backend/src/server.ts
var __importDefault =
  (this && this.__importDefault) ||
  function (mod) {
    return mod && mod.__esModule ? mod : { default: mod };
  };
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express")); // Added NextFunction for error handler type
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const auth_routes_1 = __importDefault(require("./api/auth.routes"));
const category_routes_1 = __importDefault(require("./api/category.routes"));
const course_routes_1 = __importDefault(require("./api/course.routes"));
const stats_routes_1 = __importDefault(require("./api/stats.routes"));
dotenv_1.default.config(); // Load environment variables from .env file
const app = (0, express_1.default)();
const port = process.env.BACKEND_PORT || 3001;
// --- Global Middleware ---
app.use((0, cors_1.default)()); // Enable Cross-Origin Resource Sharing
app.use(express_1.default.json()); // Parse JSON request bodies
app.use(express_1.default.urlencoded({ extended: true })); // Parse URL-encoded bodies
// --- Routes ---
// Simple root route for health check / basic confirmation
app.get("/", (req, res) => {
  res.send("Backend Server is Running!");
});
// Mount API routers under specific base paths
app.use("/api/auth", auth_routes_1.default); // Authentication routes (register, login, verify, me)
app.use("/api/categories", category_routes_1.default); // Category management routes (CRUD)
app.use("/api/courses", course_routes_1.default);
app.use("/api/stats", stats_routes_1.default);
// --- Future routes will be mounted here ---
// app.use("/api/courses", courseRoutes); // Example for later
// --- Basic Error Handling Middleware ---
// (This should typically be placed *after* all your routes)
app.use((err, req, res, next) => {
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
