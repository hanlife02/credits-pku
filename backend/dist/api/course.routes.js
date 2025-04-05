"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/*
 * @Author: Ethan && ethan@hanlife02.com
 * @Date: 2025-04-05 01:54:13
 * @LastEditors: Ethan && ethan@hanlife02.com
 * @LastEditTime: 2025-04-05 01:54:23
 * @FilePath: /code/university-credits-app/backend/src/api/course.routes.ts
 * @Description:
 *
 * Copyright (c) 2025 by Ethan, All Rights Reserved.
 */
// backend/src/api/course.routes.ts
const express_1 = require("express");
const course_controller_1 = require("../controllers/course.controller");
const auth_middleware_1 = require("../middleware/auth.middleware"); // Import authentication middleware
const router = (0, express_1.Router)();
// Apply the 'protect' middleware to ALL course routes
router.use(auth_middleware_1.protect);
// --- Define Course Routes ---
// Route: POST /api/courses
// Action: Create a new course for the logged-in user.
// Controller Function: CourseController.create
router.post("/", course_controller_1.CourseController.create);
// Route: GET /api/courses
// Action: Get all courses for the logged-in user. Allows filtering via query params
// e.g., /api/courses?categoryId=1&status=COMPLETED
// Controller Function: CourseController.getAll
router.get("/", course_controller_1.CourseController.getAll);
// Route: GET /api/courses/:id
// Action: Get a specific course by its ID, ensuring the user owns it.
// Controller Function: CourseController.getOne
router.get("/:id", course_controller_1.CourseController.getOne);
// Route: PUT /api/courses/:id
// Action: Update a specific course by its ID, ensuring the user owns it.
// Controller Function: CourseController.update
router.put("/:id", course_controller_1.CourseController.update);
// Route: DELETE /api/courses/:id
// Action: Delete a specific course by its ID, ensuring the user owns it.
// Controller Function: CourseController.delete
router.delete("/:id", course_controller_1.CourseController.delete);
// Export the configured router
exports.default = router;
