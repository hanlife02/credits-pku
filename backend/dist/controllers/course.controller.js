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
exports.CourseController = void 0;
const course_service_1 = require("../services/course.service");
const client_1 = require("@prisma/client"); // Import enum for validation
exports.CourseController = {
    // --- Create a new course ---
    create(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId;
            if (!userId) {
                res.status(401).json({ message: "Not authenticated" });
                return;
            }
            try {
                const { name, credits, categoryId, status, grade } = req.body;
                // --- Input Validation ---
                if (name === undefined ||
                    credits === undefined ||
                    categoryId === undefined ||
                    status === undefined) {
                    res.status(400).json({
                        message: "Missing required fields: name, credits, categoryId, status",
                    });
                    return;
                }
                if (typeof name !== "string" || name.trim().length === 0) {
                    res.status(400).json({ message: "Invalid course name." });
                    return;
                }
                const numericCredits = Number(credits);
                if (isNaN(numericCredits) || numericCredits < 0) {
                    res
                        .status(400)
                        .json({ message: "Credits must be a non-negative number." });
                    return;
                }
                const numericCategoryId = Number(categoryId);
                if (isNaN(numericCategoryId)) {
                    res.status(400).json({ message: "Invalid category ID." });
                    return;
                }
                if (!Object.values(client_1.CourseStatus).includes(status)) {
                    res.status(400).json({ message: "Invalid course status value." });
                    return;
                }
                let numericGrade = undefined; // Start as undefined
                if (grade !== undefined && grade !== null) {
                    numericGrade = Number(grade);
                    if (isNaN(numericGrade) || numericGrade < 0 || numericGrade > 100) {
                        res.status(400).json({
                            message: "Grade must be a number between 0 and 100, or null.",
                        });
                        return;
                    }
                }
                else if (grade === null) {
                    numericGrade = null; // Explicitly allow null
                }
                // No 'else', grade can be undefined if not provided
                // Prepare validated data for the service
                const courseData = {
                    name: name.trim(),
                    credits: numericCredits,
                    categoryId: numericCategoryId,
                    status: status, // Cast after validation
                    grade: numericGrade, // Pass prepared numericGrade or null or undefined
                };
                // Call the service
                const newCourse = yield course_service_1.CourseService.createCourse(userId, courseData);
                res.status(201).json(newCourse); // 201 Created
            }
            catch (error) {
                // Handle known errors from the service (e.g., category not found, validation)
                if (error.message.includes("not found") ||
                    error.message.includes("cannot be empty") ||
                    error.message.includes("must be") ||
                    error.message.includes("Invalid")) {
                    res.status(400).json({ message: error.message });
                }
                else {
                    console.error("Error creating course:", error);
                    res.status(500).json({ message: "Internal server error" });
                }
            }
        });
    },
    // --- Get all courses for the user (with optional filtering) ---
    getAll(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId;
            if (!userId) {
                res.status(401).json({ message: "Not authenticated" });
                return;
            }
            try {
                // --- Extract optional query parameters for filtering ---
                const { categoryId, status } = req.query;
                const filters = {};
                if (categoryId !== undefined) {
                    const numCatId = Number(categoryId);
                    if (!isNaN(numCatId)) {
                        filters.categoryId = numCatId;
                    }
                    else {
                        res
                            .status(400)
                            .json({ message: "Invalid categoryId filter: must be a number." });
                        return;
                    }
                }
                if (status !== undefined) {
                    if (Object.values(client_1.CourseStatus).includes(status)) {
                        filters.status = status;
                    }
                    else {
                        res.status(400).json({ message: "Invalid status filter value." });
                        return;
                    }
                }
                // Call the service with filters
                const courses = yield course_service_1.CourseService.getCoursesByUser(userId, filters);
                res.status(200).json(courses);
            }
            catch (error) {
                console.error("Error fetching courses:", error);
                res.status(500).json({ message: "Internal server error" });
            }
        });
    },
    // --- Get a single course by ID ---
    getOne(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId;
            const courseId = parseInt(req.params.id, 10); // Get ID from URL
            if (!userId) {
                res.status(401).json({ message: "Not authenticated" });
                return;
            }
            if (isNaN(courseId)) {
                res.status(400).json({ message: "Invalid course ID." });
                return;
            }
            try {
                const course = yield course_service_1.CourseService.getCourseById(userId, courseId);
                if (!course) {
                    res.status(404).json({ message: "Course not found." }); // Service handles ownership check
                }
                else {
                    res.status(200).json(course);
                }
            }
            catch (error) {
                console.error(`Error fetching course ${courseId}:`, error);
                res.status(500).json({ message: "Internal server error" });
            }
        });
    },
    // --- Update a course by ID ---
    update(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId;
            const courseId = parseInt(req.params.id, 10);
            if (!userId) {
                res.status(401).json({ message: "Not authenticated" });
                return;
            }
            if (isNaN(courseId)) {
                res.status(400).json({ message: "Invalid course ID." });
                return;
            }
            if (Object.keys(req.body).length === 0) {
                res
                    .status(400)
                    .json({ message: "Request body cannot be empty for update." });
                return;
            }
            try {
                const { name, credits, categoryId, status, grade } = req.body;
                // --- Prepare update data selectively (only include fields present in body) ---
                const updateData = {};
                if (name !== undefined) {
                    if (typeof name !== "string" || name.trim().length === 0)
                        throw new Error("Invalid course name."); // Use Error for service validation
                    updateData.name = name.trim();
                }
                if (credits !== undefined) {
                    const numericCredits = Number(credits);
                    if (isNaN(numericCredits) || numericCredits < 0)
                        throw new Error("Credits must be a non-negative number.");
                    updateData.credits = numericCredits;
                }
                if (categoryId !== undefined) {
                    const numericCategoryId = Number(categoryId);
                    if (isNaN(numericCategoryId))
                        throw new Error("Invalid category ID.");
                    updateData.categoryId = numericCategoryId;
                }
                if (status !== undefined) {
                    if (!Object.values(client_1.CourseStatus).includes(status))
                        throw new Error("Invalid course status value.");
                    updateData.status = status;
                }
                if (grade !== undefined) {
                    // Handling null, number, or undefined
                    if (grade === null) {
                        updateData.grade = null;
                    }
                    else {
                        const numericGrade = Number(grade);
                        if (isNaN(numericGrade) || numericGrade < 0 || numericGrade > 100) {
                            throw new Error("Grade must be a number between 0 and 100, or null.");
                        }
                        updateData.grade = numericGrade;
                    }
                }
                // Call the service to perform the update
                const updatedCourse = yield course_service_1.CourseService.updateCourse(userId, courseId, updateData);
                res.status(200).json(updatedCourse);
            }
            catch (error) {
                // Handle known errors from the service
                if (error.message.includes("not found") ||
                    error.message.includes("Invalid") ||
                    error.message.includes("must be") ||
                    error.message.includes("cannot be empty")) {
                    const statusCode = error.message.includes("not found") ? 404 : 400;
                    res.status(statusCode).json({ message: error.message });
                }
                else {
                    console.error(`Error updating course ${courseId}:`, error);
                    res.status(500).json({ message: "Internal server error" });
                }
            }
        });
    },
    // --- Delete a course by ID ---
    delete(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId;
            const courseId = parseInt(req.params.id, 10);
            if (!userId) {
                res.status(401).json({ message: "Not authenticated" });
                return;
            }
            if (isNaN(courseId)) {
                res.status(400).json({ message: "Invalid course ID." });
                return;
            }
            try {
                yield course_service_1.CourseService.deleteCourse(userId, courseId);
                res.status(204).send(); // 204 No Content for successful deletion
            }
            catch (error) {
                if (error.message.includes("not found")) {
                    res.status(404).json({ message: error.message });
                }
                else {
                    console.error(`Error deleting course ${courseId}:`, error);
                    res.status(500).json({ message: "Internal server error" });
                }
            }
        });
    },
};
