"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
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
const express_1 = require("express");
const category_controller_1 = require("../controllers/category.controller");
const auth_middleware_1 = require("../middleware/auth.middleware"); // Import the authentication middleware
const router = (0, express_1.Router)();
// Apply the 'protect' middleware to ALL routes defined in this file.
// This ensures that any request to '/api/categories/*' MUST have a valid
// JWT token, otherwise the middleware will send a 401 Unauthorized response.
router.use(auth_middleware_1.protect);
// --- Define Category Routes ---
// Route: POST /api/categories
// Action: Create a new category for the logged-in user.
// Controller Function: CategoryController.create
router.post("/", category_controller_1.CategoryController.create);
// Route: GET /api/categories
// Action: Get all categories belonging to the logged-in user.
// Controller Function: CategoryController.getAll
router.get("/", category_controller_1.CategoryController.getAll);
// Route: GET /api/categories/:id
// Action: Get a specific category by its ID, ensuring the user owns it.
// ':id' is a URL parameter captured in req.params.id
// Controller Function: CategoryController.getOne
router.get("/:id", category_controller_1.CategoryController.getOne);
// Route: PUT /api/categories/:id
// Action: Update a specific category by its ID, ensuring the user owns it.
// Controller Function: CategoryController.update
router.put("/:id", category_controller_1.CategoryController.update);
// Route: DELETE /api/categories/:id
// Action: Delete a specific category by its ID, ensuring the user owns it.
// Controller Function: CategoryController.delete
router.delete("/:id", category_controller_1.CategoryController.delete);
// Export the configured router to be used in server.ts
exports.default = router;
