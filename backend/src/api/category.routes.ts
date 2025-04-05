/*
 * @Author: Ethan && ethan@hanlife02.com
 * @Date: 2025-04-05 01:35:48
 * @LastEditors: Ethan && ethan@hanlife02.com
 * @LastEditTime: 2025-04-05 01:35:54
 * @FilePath: /code/university-credits-app/backend/src/api/category.routes.ts
 * @Description:
 *
 * Copyright (c) 2025 by Ethan, All Rights Reserved.
 */
// backend/src/api/category.routes.ts
import { Router } from "express";
import { CategoryController } from "../controllers/category.controller";
import { protect } from "../middleware/auth.middleware"; // Import the authentication middleware

const router = Router();

// Apply the 'protect' middleware to ALL routes defined in this file.
// This ensures that any request to '/api/categories/*' MUST have a valid
// JWT token, otherwise the middleware will send a 401 Unauthorized response.
router.use(protect);

// --- Define Category Routes ---

// Route: POST /api/categories
// Action: Create a new category for the logged-in user.
// Controller Function: CategoryController.create
router.post("/", CategoryController.create);

// Route: GET /api/categories
// Action: Get all categories belonging to the logged-in user.
// Controller Function: CategoryController.getAll
router.get("/", CategoryController.getAll);

// Route: GET /api/categories/:id
// Action: Get a specific category by its ID, ensuring the user owns it.
// ':id' is a URL parameter captured in req.params.id
// Controller Function: CategoryController.getOne
router.get("/:id", CategoryController.getOne);

// Route: PUT /api/categories/:id
// Action: Update a specific category by its ID, ensuring the user owns it.
// Controller Function: CategoryController.update
router.put("/:id", CategoryController.update);

// Route: DELETE /api/categories/:id
// Action: Delete a specific category by its ID, ensuring the user owns it.
// Controller Function: CategoryController.delete
router.delete("/:id", CategoryController.delete);

// Export the configured router to be used in server.ts
export default router;
