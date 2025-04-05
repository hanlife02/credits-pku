/*
 * @Author: Ethan && ethan@hanlife02.com
 * @Date: 2025-04-05 02:05:02
 * @LastEditors: Ethan && ethan@hanlife02.com
 * @LastEditTime: 2025-04-05 02:05:15
 * @FilePath: /code/university-credits-app/backend/src/controllers/stats.controller.ts
 * @Description:
 *
 * Copyright (c) 2025 by Ethan, All Rights Reserved.
 */
// backend/src/controllers/stats.controller.ts
import { Request, Response } from "express";
import { StatsService } from "../services/stats.service"; // Import the service

// Define type for authenticated requests (reuse if defined globally)
interface AuthenticatedRequest extends Request {
  user?: { userId: number; email: string };
}

export const StatsController = {
  /**
   * Handles requests to get the user's credit and GPA summary.
   * @param req - The authenticated request object.
   * @param res - The response object.
   */
  async getSummary(req: AuthenticatedRequest, res: Response): Promise<void> {
    const userId = req.user?.userId; // Get user ID from authenticated request
    if (!userId) {
      // Should be caught by middleware, but include for safety
      res.status(401).json({ message: "Not authenticated" });
      return;
    }

    try {
      // Call the service to calculate the summary for the logged-in user
      const summary = await StatsService.getSummary(userId);
      // Respond with 200 OK and the summary data
      res.status(200).json(summary);
    } catch (error: any) {
      // Handle any unexpected errors during calculation
      console.error(`Error fetching summary for user ${userId}:`, error);
      res
        .status(500)
        .json({ message: "Internal server error while generating summary." });
    }
  },
};
