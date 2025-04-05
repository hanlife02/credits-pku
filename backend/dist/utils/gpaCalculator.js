"use strict";
/*
 * @Author: Ethan && ethan@hanlife02.com
 * @Date: 2025-04-05 00:35:38
 * @LastEditors: Ethan && ethan@hanlife02.com
 * @LastEditTime: 2025-04-05 02:02:24
 * @FilePath: /code/university-credits-app/backend/src/utils/gpaCalculator.ts
 * @Description:
 *
 * Copyright (c) 2025 by Ethan, All Rights Reserved.
 */
// backend/src/utils/gpaCalculator.ts
Object.defineProperty(exports, "__esModule", { value: true });
exports.calculateGpaScore = calculateGpaScore;
function calculateGpaScore(grade) {
    if (grade === null || grade === undefined) {
        return null; // No grade, no GPA score
    }
    // Ensure grade is within 0-100 range for calculation
    const validGrade = Math.max(0, Math.min(100, grade));
    // Rule: Grades below 60 get 0 GPA
    if (validGrade < 60) {
        return 0.0;
    }
    // Apply the formula: 4 - 3 * (100 - x)^2 / 1600
    const gpa = 4 - (3 * Math.pow(100 - validGrade, 2)) / 1600;
    // Round to sensible precision, e.g., 2 decimal places
    return Math.round(gpa * 1000) / 1000;
}
