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
exports.CategoryService = void 0;
// backend/src/services/category.service.ts
const db_1 = __importDefault(require("../db"));
exports.CategoryService = {
    /**
     * Creates a new course category for a specific user.
     * Ensures category names are unique per user.
     * @param userId - The ID of the user creating the category.
     * @param data - The data for the new category.
     * @returns The newly created category.
     */
    createCategory(userId, data) {
        return __awaiter(this, void 0, void 0, function* () {
            const { name, requiredCredits, orderIndex } = data;
            // Validate input (basic example)
            if (!name || name.trim().length === 0) {
                throw new Error("Category name cannot be empty.");
            }
            // Ensure requiredCredits is a valid number and non-negative
            if (typeof requiredCredits !== "number" ||
                isNaN(requiredCredits) ||
                requiredCredits < 0) {
                throw new Error("Required credits must be a non-negative number.");
            }
            // Check if category with the same name already exists for this user
            const existingCategory = yield db_1.default.courseCategory.findUnique({
                where: {
                    userId_name: {
                        // Using the @@unique([userId, name]) constraint defined in schema.prisma
                        userId: userId,
                        name: name.trim(),
                    },
                },
            });
            if (existingCategory) {
                throw new Error(`Category with name "${name.trim()}" already exists for this user.`);
            }
            // Create the category
            const newCategory = yield db_1.default.courseCategory.create({
                data: {
                    userId: userId,
                    name: name.trim(),
                    requiredCredits: requiredCredits,
                    orderIndex: typeof orderIndex === "number" ? orderIndex : null, // Ensure orderIndex is number or null
                },
            });
            return newCategory;
        });
    },
    /**
     * Retrieves all categories for a specific user.
     * Optionally orders them by orderIndex or name.
     * @param userId - The ID of the user whose categories to fetch.
     * @returns An array of course categories.
     */
    getCategoriesByUser(userId) {
        return __awaiter(this, void 0, void 0, function* () {
            const categories = yield db_1.default.courseCategory.findMany({
                where: { userId: userId },
                orderBy: [
                    // Allow multiple sort criteria
                    { orderIndex: "asc" }, // Sort by orderIndex first (nulls are typically last in asc)
                    { name: "asc" }, // Then sort by name
                ],
            });
            return categories;
        });
    },
    /**
     * Gets a single category by its ID, ensuring it belongs to the specified user.
     * @param userId - The ID of the user requesting the category.
     * @param categoryId - The ID of the category to fetch.
     * @returns The category object or null if not found or not owned by the user.
     */
    getCategoryById(userId, categoryId) {
        return __awaiter(this, void 0, void 0, function* () {
            const category = yield db_1.default.courseCategory.findUnique({
                where: {
                    id: categoryId,
                    // Important: Ensure the user owns this category
                    userId: userId,
                },
            });
            // Returns null if ID doesn't exist OR if userId doesn't match
            // Allows controller to return 404 Not Found appropriately
            return category;
        });
    },
    /**
     * Updates an existing course category for a user.
     * @param userId - The ID of the user owning the category.
     * @param categoryId - The ID of the category to update.
     * @param data - The data to update.
     * @returns The updated category.
     */
    updateCategory(userId, categoryId, data) {
        return __awaiter(this, void 0, void 0, function* () {
            const { name, requiredCredits, orderIndex } = data;
            // 1. Verify the category exists and belongs to the user
            const existingCategory = yield db_1.default.courseCategory.findUnique({
                where: { id: categoryId }, // Find by ID first
            });
            if (!existingCategory) {
                throw new Error(`Category with ID ${categoryId} not found.`);
            }
            // Check ownership *after* finding the category
            if (existingCategory.userId !== userId) {
                // Throw error that mimics 'not found' for security (prevents leaking info that category ID exists but belongs to someone else)
                throw new Error(`Category with ID ${categoryId} not found.`);
            }
            // 2. Prepare update data, only include fields that are provided
            const updateData = {};
            if (name !== undefined) {
                const trimmedName = name.trim();
                if (trimmedName.length === 0)
                    throw new Error("Category name cannot be empty.");
                updateData.name = trimmedName;
                // Check if the NEW name conflicts with another category for the SAME user
                if (updateData.name !== existingCategory.name) {
                    const conflictingCategory = yield db_1.default.courseCategory.findUnique({
                        where: { userId_name: { userId: userId, name: updateData.name } },
                    });
                    if (conflictingCategory) {
                        throw new Error(`Another category with name "${updateData.name}" already exists.`);
                    }
                }
            }
            if (requiredCredits !== undefined) {
                if (typeof requiredCredits !== "number" ||
                    isNaN(requiredCredits) ||
                    requiredCredits < 0) {
                    throw new Error("Required credits must be a non-negative number.");
                }
                updateData.requiredCredits = requiredCredits;
            }
            // Allows setting orderIndex explicitly to null or a number
            if (orderIndex !== undefined) {
                if (orderIndex !== null &&
                    (typeof orderIndex !== "number" || isNaN(orderIndex))) {
                    throw new Error("Order index must be a number or null.");
                }
                updateData.orderIndex = orderIndex;
            }
            // Only update if there's something to update
            if (Object.keys(updateData).length === 0) {
                return existingCategory; // No changes provided, return the original
            }
            // 3. Perform the update
            const updatedCategory = yield db_1.default.courseCategory.update({
                where: {
                    id: categoryId, // Already verified ownership
                },
                data: updateData,
            });
            return updatedCategory;
        });
    },
    /**
     * Deletes a course category for a user.
     * Prisma's cascade delete (defined in schema) will also delete associated Courses.
     * @param userId - The ID of the user owning the category.
     * @param categoryId - The ID of the category to delete.
     * @returns The deleted category object (or void if preferred).
     */
    deleteCategory(userId, categoryId) {
        return __awaiter(this, void 0, void 0, function* () {
            // 1. Verify the category exists and belongs to the user FIRST
            const categoryToDelete = yield db_1.default.courseCategory.findUnique({
                where: { id: categoryId },
            });
            if (!categoryToDelete) {
                throw new Error(`Category with ID ${categoryId} not found.`);
            }
            if (categoryToDelete.userId !== userId) {
                // Again, treat as 'not found' for security
                throw new Error(`Category with ID ${categoryId} not found.`);
            }
            // 2. Perform the delete using the specific ID
            // The cascade delete defined in schema.prisma for `Course` will handle related courses.
            yield db_1.default.courseCategory.delete({
                where: { id: categoryId }, // Use the ID after verifying ownership
            });
            return categoryToDelete; // Return the object that was deleted
        });
    },
};
