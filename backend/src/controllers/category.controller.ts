// backend/src/controllers/category.controller.ts
import { Request, Response } from "express";
import { CategoryService } from "../services/category.service";

// Define a type for requests that have passed authentication
// If you defined this globally, you might not need it here again
interface AuthenticatedRequest extends Request {
  user?: { userId: number; email: string }; // This structure depends on your 'protect' middleware
}

export const CategoryController = {
  // --- Create a new category ---
  async create(req: AuthenticatedRequest, res: Response): Promise<void> {
    const userId = req.user?.userId; // Get user ID from authenticated request
    if (!userId) {
      // This should technically be caught by 'protect' middleware, but good practice to check
      res.status(401).json({ message: "Not authenticated" });
      return;
    }

    try {
      const { name, requiredCredits, orderIndex } = req.body;

      // Basic validation for required fields in the controller
      if (name === undefined || requiredCredits === undefined) {
        res
          .status(400)
          .json({ message: "Missing required fields: name, requiredCredits" });
        return;
      }

      // Prepare data, converting types if necessary (request body might be stringified)
      const categoryData = {
        name: String(name),
        requiredCredits: Number(requiredCredits),
        // Handle optional orderIndex carefully
        orderIndex:
          orderIndex !== undefined && orderIndex !== null
            ? Number(orderIndex)
            : undefined,
      };

      // Input type validation after conversion
      if (isNaN(categoryData.requiredCredits)) {
        res
          .status(400)
          .json({ message: "Invalid number format for requiredCredits." });
        return;
      }
      if (
        categoryData.orderIndex !== undefined &&
        isNaN(categoryData.orderIndex)
      ) {
        res
          .status(400)
          .json({ message: "Invalid number format for orderIndex." });
        return;
      }

      // Call the service to perform the creation logic
      const newCategory = await CategoryService.createCategory(
        userId,
        categoryData
      );
      res.status(201).json(newCategory); // Respond with 201 Created and the new category object
    } catch (error: any) {
      // Handle errors thrown by the service (validation, duplicates etc.)
      if (
        error.message.includes("already exists") ||
        error.message.includes("cannot be empty") ||
        error.message.includes("non-negative")
      ) {
        res.status(400).json({ message: error.message }); // 400 Bad Request for validation errors
      } else {
        console.error("Error creating category:", error); // Log unexpected errors
        res.status(500).json({ message: "Internal server error" }); // Generic 500 for others
      }
    }
  },

  // --- Get all categories for the logged-in user ---
  async getAll(req: AuthenticatedRequest, res: Response): Promise<void> {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ message: "Not authenticated" });
      return;
    }

    try {
      // Call the service to get categories
      const categories = await CategoryService.getCategoriesByUser(userId);
      res.status(200).json(categories); // Respond with 200 OK and the array of categories
    } catch (error: any) {
      console.error("Error fetching categories:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  },

  // --- Get a single category by its ID ---
  async getOne(req: AuthenticatedRequest, res: Response): Promise<void> {
    const userId = req.user?.userId;
    // Get category ID from URL parameters (e.g., /api/categories/123)
    const categoryId = parseInt(req.params.id, 10);

    if (!userId) {
      res.status(401).json({ message: "Not authenticated" });
      return;
    }
    // Validate that the ID from the URL is a valid number
    if (isNaN(categoryId)) {
      res.status(400).json({ message: "Invalid category ID." });
      return;
    }

    try {
      // Call the service, passing user ID for ownership check
      const category = await CategoryService.getCategoryById(
        userId,
        categoryId
      );
      if (!category) {
        // Service returns null if not found OR if user doesn't own it. Respond with 404.
        res.status(404).json({ message: `Category not found.` }); // Keep message generic
      } else {
        res.status(200).json(category); // Respond with 200 OK and the category object
      }
    } catch (error: any) {
      console.error("Error fetching category by ID:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  },

  // --- Update a category by its ID ---
  async update(req: AuthenticatedRequest, res: Response): Promise<void> {
    const userId = req.user?.userId;
    const categoryId = parseInt(req.params.id, 10); // Get ID from route parameter

    if (!userId) {
      res.status(401).json({ message: "Not authenticated" });
      return;
    }
    if (isNaN(categoryId)) {
      res.status(400).json({ message: "Invalid category ID." });
      return;
    }
    if (Object.keys(req.body).length === 0) {
      res
        .status(400)
        .json({ message: "Request body cannot be empty for update." });
      return;
    }

    try {
      const { name, requiredCredits, orderIndex } = req.body;

      // Construct update data - only include fields explicitly provided in the body
      const updateData: {
        name?: string;
        requiredCredits?: number;
        orderIndex?: number | null;
      } = {};
      if (name !== undefined) updateData.name = String(name);
      if (requiredCredits !== undefined)
        updateData.requiredCredits = Number(requiredCredits);
      // Allow setting orderIndex to null explicitly or updating it
      if (orderIndex !== undefined)
        updateData.orderIndex = orderIndex === null ? null : Number(orderIndex);

      // Further validation on converted types
      if (
        updateData.requiredCredits !== undefined &&
        isNaN(updateData.requiredCredits)
      ) {
        res
          .status(400)
          .json({ message: "Invalid number format for requiredCredits." });
        return;
      }
      if (
        updateData.orderIndex !== undefined &&
        updateData.orderIndex !== null &&
        isNaN(updateData.orderIndex)
      ) {
        res
          .status(400)
          .json({ message: "Invalid number format for orderIndex." });
        return;
      }

      // Call the service to perform the update
      const updatedCategory = await CategoryService.updateCategory(
        userId,
        categoryId,
        updateData
      );
      res.status(200).json(updatedCategory); // Respond with 200 OK and the updated object
    } catch (error: any) {
      // Handle errors from the service (not found, validation, duplicates)
      if (
        error.message.includes("not found") ||
        error.message.includes("already exists") ||
        error.message.includes("cannot be empty") ||
        error.message.includes("non-negative") ||
        error.message.includes("must be a number or null")
      ) {
        // Use 404 for 'not found', 400 for others
        const statusCode = error.message.includes("not found") ? 404 : 400;
        res.status(statusCode).json({ message: error.message });
      } else {
        console.error("Error updating category:", error);
        res.status(500).json({ message: "Internal server error" });
      }
    }
  },

  // --- Delete a category by its ID ---
  async delete(req: AuthenticatedRequest, res: Response): Promise<void> {
    const userId = req.user?.userId;
    const categoryId = parseInt(req.params.id, 10); // Get ID from route parameter

    if (!userId) {
      res.status(401).json({ message: "Not authenticated" });
      return;
    }
    if (isNaN(categoryId)) {
      res.status(400).json({ message: "Invalid category ID." });
      return;
    }

    try {
      // Call the service to perform the deletion
      await CategoryService.deleteCategory(userId, categoryId);
      // Respond with 204 No Content, standard for successful deletions with no body
      res.status(204).send();
    } catch (error: any) {
      // Handle 'not found' errors from the service
      if (error.message.includes("not found")) {
        res.status(404).json({ message: error.message });
      } else {
        console.error("Error deleting category:", error);
        res.status(500).json({ message: "Internal server error" });
      }
    }
  },
};
