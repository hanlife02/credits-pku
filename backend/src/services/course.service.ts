// backend/src/services/course.service.ts
import prisma from "../db";
import { Course, CourseStatus, Prisma } from "@prisma/client"; // Import Prisma types
import { calculateGpaScore } from "../utils/gpaCalculator"; // Import the GPA calculator

// Interface for data needed to create a course
interface CreateCourseData {
  name: string;
  credits: number;
  categoryId: number;
  status: CourseStatus; // Use the Prisma Enum type
  grade?: number | null; // Optional percentage grade (0-100)
}

// Interface for data needed to update a course
interface UpdateCourseData {
  name?: string;
  credits?: number;
  categoryId?: number;
  status?: CourseStatus;
  grade?: number | null; // Allow setting grade to null explicitly
}

export const CourseService = {
  /**
   * Creates a new course for a specific user, associated with a category.
   * Calculates GPA score if the course is completed and has a grade.
   * @param userId - The ID of the user creating the course.
   * @param data - The data for the new course.
   * @returns The newly created course.
   */
  async createCourse(userId: number, data: CreateCourseData): Promise<Course> {
    const { name, credits, categoryId, status, grade } = data;

    // 1. Validate Input Data
    if (!name || name.trim().length === 0) {
      throw new Error("Course name cannot be empty.");
    }
    if (typeof credits !== "number" || isNaN(credits) || credits < 0) {
      throw new Error("Credits must be a non-negative number.");
    }
    if (!Object.values(CourseStatus).includes(status)) {
      throw new Error("Invalid course status.");
    }
    if (
      grade !== undefined &&
      grade !== null &&
      (typeof grade !== "number" || isNaN(grade) || grade < 0 || grade > 100)
    ) {
      throw new Error("Grade must be a number between 0 and 100, or null.");
    }
    // Ensure grade is only provided if status is COMPLETED
    if (
      status !== CourseStatus.COMPLETED &&
      grade !== undefined &&
      grade !== null
    ) {
      throw new Error("Grade can only be set for completed courses.");
    }

    // 2. Verify Category Exists and Belongs to User
    const category = await prisma.courseCategory.findUnique({
      where: { id: categoryId },
    });
    if (!category) {
      throw new Error(`Category with ID ${categoryId} not found.`);
    }
    if (category.userId !== userId) {
      // Treat as not found for security
      throw new Error(`Category with ID ${categoryId} not found.`);
    }

    // 3. Calculate GPA Score (if applicable)
    let gpaScore: number | null = null;
    // Ensure grade is explicitly checked for null/undefined before calculation
    const finalGrade = status === CourseStatus.COMPLETED ? grade : null;
    if (finalGrade !== null && finalGrade !== undefined) {
      gpaScore = calculateGpaScore(finalGrade);
    }

    // 4. Create Course in Database
    const newCourse = await prisma.course.create({
      data: {
        userId: userId,
        categoryId: categoryId,
        name: name.trim(),
        credits: credits,
        status: status,
        grade: finalGrade, // Store null if not completed or no grade provided
        gpaScore: gpaScore, // Store calculated GPA or null
      },
      include: {
        // Optionally include category info in the response
        category: true,
      },
    });

    return newCourse;
  },

  /**
   * Retrieves courses for a specific user, with optional filtering.
   * @param userId - The ID of the user whose courses to fetch.
   * @param filters - Optional filters (e.g., categoryId, status).
   * @returns An array of courses.
   */
  async getCoursesByUser(
    userId: number,
    filters?: { categoryId?: number; status?: CourseStatus }
  ): Promise<Course[]> {
    const whereClause: Prisma.CourseWhereInput = { userId: userId };

    if (filters?.categoryId !== undefined) {
      whereClause.categoryId = filters.categoryId;
    }
    if (filters?.status !== undefined) {
      whereClause.status = filters.status;
    }

    const courses = await prisma.course.findMany({
      where: whereClause,
      include: {
        // Include category details for context
        category: {
          select: { id: true, name: true }, // Select only needed category fields
        },
      },
      orderBy: {
        // Example: order by creation date or name
        createdAt: "desc",
        // name: 'asc',
      },
    });
    return courses;
  },

  /**
   * Gets a single course by its ID, ensuring it belongs to the specified user.
   * @param userId - The ID of the user requesting the course.
   * @param courseId - The ID of the course to fetch.
   * @returns The course object or null if not found or not owned by the user.
   */
  async getCourseById(
    userId: number,
    courseId: number
  ): Promise<Course | null> {
    const course = await prisma.course.findUnique({
      where: {
        id: courseId,
        userId: userId, // Ensures ownership
      },
      include: {
        // Optionally include category info
        category: true,
      },
    });
    return course; // Returns null if ID doesn't exist OR if userId doesn't match
  },

  /**
   * Updates an existing course for a user.
   * Recalculates GPA score if grade or status changes.
   * @param userId - The ID of the user owning the course.
   * @param courseId - The ID of the course to update.
   * @param data - The data to update.
   * @returns The updated course.
   */
  async updateCourse(
    userId: number,
    courseId: number,
    data: UpdateCourseData
  ): Promise<Course> {
    // 1. Verify Course Exists and Belongs to User
    const existingCourse = await prisma.course.findUnique({
      where: { id: courseId },
    });

    if (!existingCourse) {
      throw new Error(`Course with ID ${courseId} not found.`);
    }
    if (existingCourse.userId !== userId) {
      // Treat as not found for security
      throw new Error(`Course with ID ${courseId} not found.`);
    }

    // 2. Prepare Update Data & Validate
    const updateData: Prisma.CourseUpdateInput = {}; // Use Prisma's update type
    let needsGpaRecalc = false;
    let newStatus = existingCourse.status; // Start with existing status
    let newGrade = existingCourse.grade; // Start with existing grade

    if (data.name !== undefined) {
      const trimmedName = data.name.trim();
      if (trimmedName.length === 0)
        throw new Error("Course name cannot be empty.");
      updateData.name = trimmedName;
    }
    if (data.credits !== undefined) {
      if (
        typeof data.credits !== "number" ||
        isNaN(data.credits) ||
        data.credits < 0
      ) {
        throw new Error("Credits must be a non-negative number.");
      }
      updateData.credits = data.credits;
    }
    if (data.categoryId !== undefined) {
      if (typeof data.categoryId !== "number" || isNaN(data.categoryId)) {
        throw new Error("Invalid Category ID format.");
      }
      // Verify the NEW category exists and belongs to the user
      const newCategory = await prisma.courseCategory.findUnique({
        where: { id: data.categoryId },
      });
      if (!newCategory || newCategory.userId !== userId) {
        throw new Error(`Category with ID ${data.categoryId} not found.`);
      }
      // Correct way to update relation using 'connect':
      updateData.category = {
        // Use the relation field name 'category'
        connect: {
          id: data.categoryId, // Connect to the category with this ID
        },
      };
    }

    if (data.status !== undefined) {
      if (!Object.values(CourseStatus).includes(data.status)) {
        throw new Error("Invalid course status.");
      }
      updateData.status = data.status;
      newStatus = data.status; // Track the potential new status for GPA logic
      needsGpaRecalc = true; // Status change always triggers recalc
    }
    if (data.grade !== undefined) {
      // Allows setting grade to null or a number
      if (
        data.grade !== null &&
        (typeof data.grade !== "number" ||
          isNaN(data.grade) ||
          data.grade < 0 ||
          data.grade > 100)
      ) {
        throw new Error("Grade must be a number between 0 and 100, or null.");
      }
      // Store the potential new grade for GPA logic BEFORE validating against status
      newGrade = data.grade;
      needsGpaRecalc = true; // Grade change always triggers recalc
    }

    // 3. Validate Status/Grade Combination AFTER potentially updating both
    if (newStatus !== CourseStatus.COMPLETED && newGrade !== null) {
      // If status is being set to PENDING, or was already PENDING and grade is being set non-null
      throw new Error("Grade can only be set for completed courses.");
    }

    // 4. Recalculate GPA if needed
    if (needsGpaRecalc) {
      if (newStatus === CourseStatus.COMPLETED && newGrade !== null) {
        // Calculate GPA only if completed AND grade is provided
        updateData.gpaScore = calculateGpaScore(newGrade);
        // Update the grade field itself in the update payload
        updateData.grade = newGrade;
      } else {
        // If status is PENDING or grade is null, GPA is null
        updateData.gpaScore = null;
        // Also ensure grade is null if status is PENDING
        updateData.grade = null;
      }
    } else if (data.grade !== undefined) {
      // Re-check the incoming 'data.grade' here
      // This block handles the case where ONLY grade is updated (status wasn't in input)
      const gradeToUpdate = data.grade; // Use the original incoming value

      if (
        existingCourse.status === CourseStatus.COMPLETED &&
        gradeToUpdate !== null
      ) {
        if (
          typeof gradeToUpdate !== "number" ||
          isNaN(gradeToUpdate) ||
          gradeToUpdate < 0 ||
          gradeToUpdate > 100
        ) {
          // Add validation here too if 'data.grade' wasn't already checked thoroughly above
          throw new Error("Grade must be a number between 0 and 100, or null.");
        }
        updateData.grade = gradeToUpdate; // Set grade in update payload
        // Pass the validated number to the calculator
        updateData.gpaScore = calculateGpaScore(gradeToUpdate);
      } else if (
        existingCourse.status === CourseStatus.COMPLETED &&
        gradeToUpdate === null
      ) {
        updateData.grade = null; // Set grade to null
        updateData.gpaScore = null; // GPA is also null
      }
      // If existing course status wasn't COMPLETED, don't update grade/gpa based on just grade input
    }

    // Ensure we don't update if no relevant data changed
    if (Object.keys(updateData).length === 0) {
      return existingCourse; // No effective changes
    }

    // 5. Perform the Update
    const updatedCourse = await prisma.course.update({
      where: { id: courseId }, // Ownership already verified
      data: updateData,
      include: { category: true }, // Include category in response
    });

    return updatedCourse;
  },

  /**
   * Deletes a course for a user.
   * @param userId - The ID of the user owning the course.
   * @param courseId - The ID of the course to delete.
   * @returns The deleted course object.
   */
  async deleteCourse(userId: number, courseId: number): Promise<Course> {
    // 1. Verify Course Exists and Belongs to User FIRST
    const courseToDelete = await prisma.course.findUnique({
      where: { id: courseId },
    });

    if (!courseToDelete) {
      throw new Error(`Course with ID ${courseId} not found.`);
    }
    if (courseToDelete.userId !== userId) {
      // Treat as not found for security
      throw new Error(`Course with ID ${courseId} not found.`);
    }

    // 2. Perform the delete
    await prisma.course.delete({
      where: { id: courseId }, // Use the ID after verification
    });

    return courseToDelete; // Return the deleted object
  },
};
