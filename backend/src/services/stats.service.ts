// backend/src/services/stats.service.ts
import prisma from "../db";
import { CourseCategory, Course, CourseStatus } from "@prisma/client";

// Define the structure of the summary data to be returned
interface CategorySummary {
  id: number;
  name: string;
  requiredCredits: number;
  earnedCredits: number;
  remainingCredits: number;
}

interface OverallSummary {
  graduationTotalCredits: number | null; // The user's set goal
  totalRequiredFromCategories: number; // Sum of category requirements
  totalEarnedCredits: number;
  totalRemainingCredits: number | null; // Calculated against graduation goal
  overallGpa: number | null;
  categories: CategorySummary[];
}

export const StatsService = {
  async getSummary(userId: number): Promise<OverallSummary> {
    // 1. Fetch USER DATA, categories, and completed courses
    // Fetch user data including the new field
    const [userData, categories, completedCourses] = await Promise.all([
      prisma.user.findUnique({
        // <--- FETCH USER DATA
        where: { id: userId },
        select: { graduationTotalCredits: true },
      }),
      prisma.courseCategory.findMany({
        /* ... where/orderBy ... */
      }),
      prisma.course.findMany({
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
    const categorySummariesMap = new Map<number, CategorySummary>();

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
    let overallGpa: number | null = null;
    // ... (calculate overallGpa) ...

    // 6. Convert map values to array
    const categorySummariesArray = Array.from(categorySummariesMap.values());

    // 7. CALCULATE Overall Remaining Credits (based on user's goal)
    let totalRemainingCredits: number | null = null;
    if (graduationGoal !== null) {
      totalRemainingCredits = Math.max(0, graduationGoal - totalEarnedCredits);
    }

    // 8. Construct the final summary object (UPDATED structure)
    const summary: OverallSummary = {
      graduationTotalCredits: graduationGoal, // User's set goal
      totalRequiredFromCategories: totalRequiredFromCategories, // Sum from categories
      totalEarnedCredits: totalEarnedCredits,
      totalRemainingCredits: totalRemainingCredits, // Based on goal
      overallGpa: overallGpa,
      categories: categorySummariesArray,
    };

    return summary;
  },
};
