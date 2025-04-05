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
Object.defineProperty(exports, "__esModule", { value: true });
exports.StatsController = void 0;
const stats_service_1 = require("../services/stats.service"); // Import the service
exports.StatsController = {
    /**
     * Handles requests to get the user's credit and GPA summary.
     * @param req - The authenticated request object.
     * @param res - The response object.
     */
    getSummary(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId; // Get user ID from authenticated request
            if (!userId) {
                // Should be caught by middleware, but include for safety
                res.status(401).json({ message: "Not authenticated" });
                return;
            }
            try {
                // Call the service to calculate the summary for the logged-in user
                const summary = yield stats_service_1.StatsService.getSummary(userId);
                // Respond with 200 OK and the summary data
                res.status(200).json(summary);
            }
            catch (error) {
                // Handle any unexpected errors during calculation
                console.error(`Error fetching summary for user ${userId}:`, error);
                res
                    .status(500)
                    .json({ message: "Internal server error while generating summary." });
            }
        });
    },
};
