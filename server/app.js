/*
 * @Author: Ethan && ethan@hanlife02.com
 * @Date: 2025-04-17 17:08:11
 * @LastEditors: Ethan && ethan@hanlife02.com
 * @LastEditTime: 2025-04-17 17:30:16
 * @FilePath: /credits-pku/server/app.js
 * @Description:
 *
 * Copyright (c) 2025 by Ethan, All Rights Reserved.
 */
const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const connectDB = require("./config/db");
const errorHandler = require("./middleware/errorHandler");

// Load env vars
dotenv.config();

// Connect to database
connectDB();

// Route files
const authRoutes = require("./routes/authRoutes");
const categoryRoutes = require("./routes/categoryRoutes");
const courseRoutes = require("./routes/courseRoutes");
const userRoutes = require("./routes/userRoutes");

const app = express();

// Body parser
app.use(express.json());

// Enable CORS
app.use(cors());

// Mount routers
app.use("/api/auth", authRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/courses", courseRoutes);
app.use("/api/users", userRoutes);

// Error handler middleware
app.use(errorHandler);

module.exports = app;
