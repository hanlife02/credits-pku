// frontend/src/pages/CoursesPage/CoursesPage.tsx
import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import apiClient from "../../services/apiClient";
import styles from "./CoursesPage.module.css";

// --- 数据结构定义 ---
interface Category {
  id: number;
  name: string;
}
interface Course {
  id: number;
  name: string;
  credits: number;
  categoryId: number;
  status: "COMPLETED" | "PENDING";
  grade: number | null;
  gpaScore: number | null;
  createdAt?: string;
  updatedAt?: string;
  category?: {
    // 从后端 include 返回的嵌套数据
    id: number;
    name: string;
  };
}
interface CourseFormData {
  name: string;
  credits: string;
  categoryId: string;
  status: "COMPLETED" | "PENDING";
  grade: string;
}

const CoursesPage: React.FC = () => {
  // --- State ----
  const [courses, setCourses] = useState<Course[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [currentCourseId, setCurrentCourseId] = useState<number | null>(null);
  const [formData, setFormData] = useState<CourseFormData>({
    name: "",
    credits: "",
    categoryId: "", // 初始为空，等待类别加载
    status: "PENDING",
    grade: "",
  });
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // --- Hooks ---
  const navigate = useNavigate();

  // --- 数据获取回调 ---
  const fetchData = useCallback(async () => {
    // 优化：仅在首次加载时设置全局 loading
    if (courses.length === 0 && categories.length === 0) setIsLoading(true);
    setError(null);
    try {
      const [coursesResponse, categoriesResponse] = await Promise.all([
        apiClient.get<Course[]>("/courses"),
        apiClient.get<Category[]>("/categories"),
      ]);
      setCourses(coursesResponse.data || []);
      const fetchedCategories = categoriesResponse.data || [];
      setCategories(fetchedCategories);

      // 只有在表单 categoryId 为空 或 当前选中的 categoryId 无效时，才设置默认值
      if (fetchedCategories.length > 0) {
        const currentSelectionExists = fetchedCategories.some(
          (cat) => cat.id.toString() === formData.categoryId
        );
        if (formData.categoryId === "" || !currentSelectionExists) {
          setFormData((prev) => ({
            ...prev,
            categoryId: fetchedCategories[0].id.toString(),
          }));
        }
      } else if (formData.categoryId !== "") {
        // 如果之前有选中的类别但现在类别列表为空了，重置选择
        setFormData((prev) => ({ ...prev, categoryId: "" }));
      }
    } catch (err) {
      console.error("获取课程数据失败:", err);
      setError("无法加载课程数据，请稍后重试。");
    } finally {
      setIsLoading(false);
    }
  }, [courses.length, categories.length, formData.categoryId]); // 调整依赖项

  // --- Effect Hook: 组件挂载时获取数据 ---
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // --- 表单输入处理 ---
  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => {
      const newState = { ...prev, [name]: value };
      if (name === "status" && value === "PENDING") {
        newState.grade = ""; // 状态切换为PENDING时清空成绩
      }
      return newState;
    });
    setFormError(null);
  };

  // --- 表单操作 ---
  const handleEdit = (course: Course) => {
    setIsEditing(true);
    setCurrentCourseId(course.id);
    setFormData({
      name: course.name,
      credits: course.credits.toString(),
      categoryId: course.categoryId.toString(),
      status: course.status,
      grade: course.grade !== null ? course.grade.toString() : "",
    });
    setFormError(null);
    window.scrollTo(0, 0);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setCurrentCourseId(null);
    // 重置表单，类别 ID 设为列表中的第一个（如果存在）
    setFormData({
      name: "",
      credits: "",
      categoryId: categories[0]?.id.toString() || "",
      status: "PENDING",
      grade: "",
    });
    setFormError(null);
  };

  // --- 删除课程 (可以优化 loading 状态) ---
  const handleDelete = async (courseId: number, courseName: string) => {
    if (!window.confirm(`确定要删除课程 "${courseName}" 吗？`)) return;
    setError(null);
    // 可以用局部 loading 状态，或临时禁用按钮，而不是全局 loading
    // setIsLoading(true);
    try {
      await apiClient.delete(`/courses/${courseId}`);
      setCourses((prev) => prev.filter((c) => c.id !== courseId));
      if (isEditing && currentCourseId === courseId) handleCancelEdit();
    } catch (err) {
      console.error("删除课程错误:", err);
      let message = "删除课程失败。";
      if (typeof err === "object" && err !== null && "response" in err) {
        const responseErr = err as {
          response?: { data?: { message?: string } };
        };
        if (responseErr.response?.data?.message) {
          message = responseErr.response.data.message;
        }
      }
      setError(message);
    }
    // finally { setIsLoading(false); }
  };

  // --- 提交表单 (添加或更新) ---
  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError(null);

    // --- 数据转换与验证 ---
    const numericCredits = parseFloat(formData.credits);
    const numericCategoryId = parseInt(formData.categoryId, 10);
    let numericGrade: number | null = null;

    if (!formData.name.trim()) {
      setFormError("课程名称不能为空。");
      return;
    }
    if (isNaN(numericCredits) || numericCredits < 0) {
      setFormError("请输入有效的非负学分。");
      return;
    }
    if (isNaN(numericCategoryId)) {
      setFormError("请选择一个课程类别。");
      return;
    }
    if (formData.status !== "COMPLETED" && formData.status !== "PENDING") {
      setFormError("请选择有效的课程状态。");
      return;
    }

    if (formData.status === "COMPLETED" && formData.grade !== "") {
      numericGrade = parseFloat(formData.grade);
      if (isNaN(numericGrade) || numericGrade < 0 || numericGrade > 100) {
        setFormError("成绩必须是 0 到 100 之间的数字，或为空。");
        return;
      }
    } else if (formData.status === "COMPLETED" && formData.grade === "") {
      // 如果状态是完成但成绩为空，允许提交
      numericGrade = null;
    } else if (formData.status === "PENDING" && formData.grade !== "") {
      setFormError("未完成的课程不能有成绩。");
      return;
    }

    const courseDataPayload = {
      name: formData.name.trim(),
      credits: numericCredits,
      categoryId: numericCategoryId,
      status: formData.status,
      grade: numericGrade,
    };
    // --- 结束验证 ---

    setIsSubmitting(true);
    try {
      let response; // 存储响应
      if (isEditing && currentCourseId !== null) {
        console.log(`尝试更新课程 ID: ${currentCourseId}`, courseDataPayload);
        response = await apiClient.put<Course>(
          `/courses/${currentCourseId}`,
          courseDataPayload
        ); // 获取响应
        console.log("课程更新成功");
      } else {
        console.log("尝试添加新课程:", courseDataPayload);
        response = await apiClient.post<Course>("/courses", courseDataPayload); // 获取响应
        console.log("课程添加成功");
      }

      // --- 修改部分：使用 navigate 跳转 ---
      handleCancelEdit(); // 重置表单

      // 可选: 成功提示
      alert(
        `课程 "${response.data.name}" ${isEditing ? "更新" : "添加"}成功！`
      );

      console.log("操作成功，跳转回 Dashboard...");
      navigate("/dashboard"); // <--- 跳转回仪表盘
      // --- 结束修改部分 ---
    } catch (err: unknown) {
      console.error("课程表单提交错误:", err);
      let message = isEditing ? "更新课程失败。" : "添加课程失败。";
      if (typeof err === "object" && err !== null && "response" in err) {
        const responseErr = err as {
          response?: { data?: { message?: string } };
        };
        if (responseErr.response?.data?.message) {
          message = responseErr.response.data.message;
        }
      }
      setFormError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // --- 渲染逻辑 ---
  return (
    <div className={styles.pageContainer}>
      <h1 className={styles.title}>课程管理</h1>

      {isLoading && courses.length === 0 && categories.length === 0 && (
        <div className={styles.loadingIndicator}></div>
      )}
      {error && !isLoading && <div className={styles.error}>{error}</div>}

      {!isLoading && !error && (
        <>
          {/* --- 添加/编辑表单 --- */}
          <h2 className={styles.sectionTitle}>
            {isEditing ? `编辑课程: ${formData.name}` : "添加新课程"}
          </h2>
          {categories.length === 0 && (
            <p style={{ color: "orange", marginBottom: "1rem" }}>
              请先在“类别管理”页面添加课程类别。
            </p>
          )}
          {formError && (
            <div className={`${styles.message} ${styles.errorMessage}`}>
              {formError}
            </div>
          )}
          <form onSubmit={handleSubmit} className={styles.courseForm}>
            {/* 课程名称 */}
            <div className={`${styles.formGroup} ${styles.courseName}`}>
              <label htmlFor="course-name">课程名称</label>
              <input
                type="text"
                id="course-name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                disabled={isSubmitting}
                required
              />
            </div>
            {/* 学分 */}
            <div className={styles.formGroup}>
              <label htmlFor="course-credits">学分</label>
              <input
                type="number"
                id="course-credits"
                name="credits"
                value={formData.credits}
                onChange={handleInputChange}
                disabled={isSubmitting}
                min="0"
                step="0.1"
                required
              />
            </div>
            {/* 课程类别 (下拉) */}
            <div className={styles.formGroup}>
              <label htmlFor="course-category">所属类别</label>
              <select
                id="course-category"
                name="categoryId"
                value={formData.categoryId}
                onChange={handleInputChange}
                disabled={isSubmitting || categories.length === 0}
                required
              >
                {categories.length === 0 ? (
                  <option value="" disabled>
                    无可用类别
                  </option>
                ) : (
                  <>
                    <option value="" disabled={formData.categoryId !== ""}>
                      -- 请选择 --
                    </option>
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name}
                      </option>
                    ))}
                  </>
                )}
              </select>
            </div>
            {/* 状态 (下拉) */}
            <div className={styles.formGroup}>
              <label htmlFor="course-status">状态</label>
              <select
                id="course-status"
                name="status"
                value={formData.status}
                onChange={handleInputChange}
                disabled={isSubmitting}
                required
              >
                <option value="PENDING">未完成 (Pending)</option>
                <option value="COMPLETED">已完成 (Completed)</option>
              </select>
            </div>
            {/* 成绩 (仅在状态为 Completed 时显示) */}
            {formData.status === "COMPLETED" && (
              <div className={`${styles.formGroup} ${styles.gradeInput}`}>
                <label htmlFor="course-grade">成绩 (0-100，可选)</label>
                <input
                  type="number"
                  id="course-grade"
                  name="grade"
                  value={formData.grade}
                  onChange={handleInputChange}
                  disabled={isSubmitting}
                  min="0"
                  max="100"
                  step="0.1"
                  placeholder="选填"
                />
              </div>
            )}
            {/* 表单操作按钮 */}
            <div className={styles.formActions}>
              <button
                type="submit"
                className={styles.formButton}
                disabled={isSubmitting || categories.length === 0}
              >
                {isSubmitting
                  ? isEditing
                    ? "更新中..."
                    : "添加中..."
                  : isEditing
                  ? "更新课程"
                  : "添加课程"}
              </button>
              {isEditing && (
                <button
                  type="button"
                  onClick={handleCancelEdit}
                  className={styles.cancelButton}
                  disabled={isSubmitting}
                >
                  取消
                </button>
              )}
            </div>
          </form>
          {/* --- 课程列表 --- */}
          <h2 className={styles.sectionTitle}>已添加课程</h2>
          {isLoading && courses.length > 0 && <p>正在更新列表...</p>}{" "}
          {/* 显示列表加载状态 */}
          {!isLoading && courses.length === 0 ? (
            <p>您还没有添加任何课程。</p>
          ) : (
            !isLoading && (
              <table className={styles.coursesTable}>
                <thead>
                  <tr>
                    <th>课程名称</th>
                    <th>类别</th>
                    <th style={{ textAlign: "right" }}>学分</th>
                    <th>状态</th>
                    <th style={{ textAlign: "right" }}>成绩</th>
                    <th style={{ textAlign: "right" }}>GPA</th>
                    <th>操作</th>
                  </tr>
                </thead>
                <tbody>
                  {courses.map((course) => (
                    <tr key={course.id}>
                      <td>{course.name}</td>
                      <td>
                        {course.category?.name || (
                          <span style={{ color: "#aaa" }}>未知</span>
                        )}
                      </td>
                      <td style={{ textAlign: "right" }}>
                        {course.credits.toFixed(1)}
                      </td>
                      <td className={styles.statusCell}>
                        {" "}
                        <span
                          className={
                            course.status === "COMPLETED"
                              ? styles.statusCompleted
                              : styles.statusPending
                          }
                        >
                          {" "}
                          {course.status === "COMPLETED"
                            ? "已完成"
                            : "未完成"}{" "}
                        </span>{" "}
                      </td>
                      <td style={{ textAlign: "right" }}>
                        {course.grade !== null
                          ? course.grade.toFixed(1)
                          : " - "}
                      </td>
                      <td
                        className={styles.gpaCell}
                        style={{ textAlign: "right" }}
                      >
                        {course.gpaScore !== null
                          ? course.gpaScore.toFixed(3)
                          : " - "}
                      </td>
                      <td className={styles.courseActions}>
                        <button
                          onClick={() => handleEdit(course)}
                          className={styles.actionButton}
                          title="编辑"
                          disabled={isSubmitting || isLoading}
                        >
                          ✏️
                        </button>
                        <button
                          onClick={() => handleDelete(course.id, course.name)}
                          className={styles.deleteButton}
                          title="删除"
                          disabled={isSubmitting || isLoading}
                        >
                          🗑️
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )
          )}
        </>
      )}
    </div>
  );
};

export default CoursesPage;
