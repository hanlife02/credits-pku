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
exports.StatsService = void 0;
// backend/src/services/stats.service.ts
const db_1 = __importDefault(require("../db"));
exports.StatsService = {
    getSummary(userId) {
        return __awaiter(this, void 0, void 0, function* () {
            // 1. Fetch USER DATA, categories, and completed courses
            // Fetch user data including the new field
            const [userData, categories, completedCourses] = yield Promise.all([
                db_1.default.user.findUnique({
                    // <--- FETCH USER DATA
                    where: { id: userId },
                    select: { graduationTotalCredits: true },
                }),
                db_1.default.courseCategory.findMany({
                /* ... where/orderBy ... */
                }),
                db_1.default.course.findMany({
                /* ... where/select ... */
                }),
            ]);
            // --- Added Check ---
            if (!userData) {
                // Should not happen if userId comes from valid token, but good practice
                throw new Error("User not found.");
            }
            const graduationGoal = userData.graduationTotalCredits; // User's overall goal (can be null)
            // --- End Added Check ---
            // 2. Initialize summary variables
            let totalRequiredFromCategories = 0; // Renamed for clarity
            let totalEarnedCredits = 0;
            // ... (totalWeightedGpaPoints, totalGpaCredits remain the same) ...
            const categorySummariesMap = new Map();
            // 3. Process Categories: calculate total required and initialize summary map
            for (const category of categories) {
                totalRequiredFromCategories += category.requiredCredits;
                // ---- CORRECT INITIALIZATION ----
                categorySummariesMap.set(category.id, {
                    id: category.id,
                    name: category.name,
                    requiredCredits: category.requiredCredits,
                    earnedCredits: 0, // Start earned credits at 0
                    remainingCredits: category.requiredCredits, // Initially, remaining equals required
                });
                // ---- END CORRECTION ----
            }
            // 4. Process Completed Courses: calculate earned credits and GPA components
            // ... (This loop remains exactly the same) ...
            for (const course of completedCourses) {
                // ... (update totalEarnedCredits) ...
                // ... (update categorySummary earned/remaining) ...
                // ... (update totalWeightedGpaPoints and totalGpaCredits) ...
            }
            // 5. Calculate Overall GPA
            // ... (This calculation remains exactly the same) ...
            let overallGpa = null;
            // ... (calculate overallGpa) ...
            // 6. Convert map values to array
            const categorySummariesArray = Array.from(categorySummariesMap.values());
            // 7. CALCULATE Overall Remaining Credits (based on user's goal)
            let totalRemainingCredits = null;
            if (graduationGoal !== null) {
                totalRemainingCredits = Math.max(0, graduationGoal - totalEarnedCredits);
            }
            // 8. Construct the final summary object (UPDATED structure)
            const summary = {
                graduationTotalCredits: graduationGoal, // User's set goal
                totalRequiredFromCategories: totalRequiredFromCategories, // Sum from categories
                totalEarnedCredits: totalEarnedCredits,
                totalRemainingCredits: totalRemainingCredits, // Based on goal
                overallGpa: overallGpa,
                categories: categorySummariesArray,
            };
            return summary;
        });
    },
};
