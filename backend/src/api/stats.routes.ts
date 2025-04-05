/*
 * @Author: Ethan && ethan@hanlife02.com
 * @Date: 2025-04-05 02:05:36
 * @LastEditors: Ethan && ethan@hanlife02.com
 * @LastEditTime: 2025-04-05 02:05:46
 * @FilePath: /code/university-credits-app/backend/src/api/stats.routes.ts
 * @Description:
 *
 * Copyright (c) 2025 by Ethan, All Rights Reserved.
 */
// backend/src/api/stats.routes.ts
import { Router } from "express";
import { StatsController } from "../controllers/stats.controller"; // Import the controller
import { protect } from "../middleware/auth.middleware"; // Import authentication middleware

const router = Router();

// Apply the 'protect' middleware to ALL stats routes defined here
router.use(protect);

// --- Define Statistics Routes ---

// Route: GET /api/stats/summary
// Action: Get the calculated credit and GPA summary for the logged-in user.
// Controller Function: StatsController.getSummary
router.get("/summary", StatsController.getSummary);

// You could add more stats-related routes here in the future if needed

// Export the configured router
export default router;
