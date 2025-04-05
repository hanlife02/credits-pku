// frontend/src/pages/CategoriesPage/CategoriesPage.tsx
import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom"; // <-- 导入 useNavigate
import apiClient from "../../services/apiClient";
import styles from "./CategoriesPage.module.css";

// 定义 Category 数据结构 (与后端匹配)
interface Category {
  id: number;
  name: string;
  requiredCredits: number;
  orderIndex?: number | null;
}

const CategoriesPage: React.FC = () => {
  // --- State ---
  const [categories, setCategories] = useState<Category[]>([]); // 类别列表
  const [isLoading, setIsLoading] = useState<boolean>(true); // 页面加载状态
  const [error, setError] = useState<string | null>(null); // 页面级错误信息
  const [formError, setFormError] = useState<string | null>(null); // 表单特定的错误信息

  // 表单状态 (用于添加或编辑)
  const [isEditing, setIsEditing] = useState<boolean>(false); // 是否处于编辑模式
  const [currentCategoryId, setCurrentCategoryId] = useState<number | null>(
    null
  ); // 正在编辑的类别的 ID
  const [name, setName] = useState<string>(""); // 类别名称输入
  const [credits, setCredits] = useState<string>(""); // 要求学分输入 (字符串)
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false); // 表单提交状态

  // --- Hooks ---
  const navigate = useNavigate(); // <-- 调用 useNavigate Hook

  // --- 获取类别数据的 Effect ---
  const fetchCategories = useCallback(async () => {
    // 如果是页面初次加载，显示 loading
    if (categories.length === 0) setIsLoading(true);
    setError(null);
    try {
      const response = await apiClient.get<Category[]>("/categories");
      setCategories(response.data || []);
    } catch (err) {
      console.error("获取类别列表失败:", err);
      setError("无法加载类别列表，请稍后重试。");
    } finally {
      setIsLoading(false);
    }
  }, [categories.length]); // categories.length 作为依赖可能导致不必要的 fetch，可以考虑去掉

  useEffect(() => {
    fetchCategories(); // 组件挂载时获取数据
  }, [fetchCategories]); // 依赖 fetchCategories

  // --- 表单处理 ---
  const handleEdit = (category: Category) => {
    setIsEditing(true);
    setCurrentCategoryId(category.id);
    setName(category.name);
    setCredits(category.requiredCredits.toString());
    setFormError(null);
    window.scrollTo(0, 0);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setCurrentCategoryId(null);
    setName("");
    setCredits("");
    setFormError(null);
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError(null);

    const numericCredits = parseFloat(credits);
    if (!name.trim()) {
      setFormError("类别名称不能为空。");
      return;
    }
    if (isNaN(numericCredits) || numericCredits < 0) {
      setFormError("请输入有效的非负学分。");
      return;
    }

    setIsSubmitting(true);

    const categoryData = { name: name.trim(), requiredCredits: numericCredits };

    try {
      let response; // 存储 API 响应
      if (isEditing && currentCategoryId !== null) {
        console.log(`尝试更新类别 ID: ${currentCategoryId}`, categoryData);
        response = await apiClient.put<Category>(
          `/categories/${currentCategoryId}`,
          categoryData
        ); // 获取完整响应
        console.log("类别更新成功");
      } else {
        console.log("尝试添加新类别:", categoryData);
        response = await apiClient.post<Category>("/categories", categoryData); // 获取完整响应
        console.log("类别添加成功");
      }

      // --- 修改部分：使用 navigate 跳转 ---
      handleCancelEdit(); // 清空表单状态

      // 可选：简单的成功提示
      alert(
        `类别 "${response.data.name}" ${isEditing ? "更新" : "添加"}成功！`
      );

      console.log("操作成功，跳转回 Dashboard...");
      navigate("/dashboard"); // <--- 跳转回仪表盘
      // --- 结束修改部分 ---
    } catch (err: unknown) {
      console.error("类别表单提交错误:", err);
      let message = isEditing
        ? "更新类别失败，请稍后再试。"
        : "添加类别失败，请稍后再试。";
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

  const handleDelete = async (categoryId: number, categoryName: string) => {
    if (
      !window.confirm(
        `确定要删除类别 "${categoryName}" 吗？\n警告：删除类别将同时删除所有属于该类别的课程记录！`
      )
    ) {
      return;
    }
    setError(null);
    setIsLoading(true); // 显示整体 loading，因为列表会变化

    try {
      console.log(`尝试删除类别 ID: ${categoryId}`);
      await apiClient.delete(`/categories/${categoryId}`);
      console.log("类别删除成功");
      // 重新获取数据以更新列表 (比前端过滤更简单可靠)
      fetchCategories();
      // 如果正在编辑被删除的项，则取消编辑
      if (isEditing && currentCategoryId === categoryId) {
        handleCancelEdit();
      }
    } catch (err: unknown) {
      console.error("删除类别 API 错误:", err);
      let message = "删除类别失败，请稍后再试。";
      if (typeof err === "object" && err !== null && "response" in err) {
        const responseErr = err as {
          response?: { data?: { message?: string } };
        };
        if (responseErr.response?.data?.message)
          message = responseErr.response.data.message;
      }
      setError(message);
      setIsLoading(false); // 错误时取消loading
    }
    // finally 中 isLoading 由 fetchCategories 设置
  };

  // --- 渲染逻辑 ---
  return (
    <div className={styles.pageContainer}>
      <h1 className={styles.title}>课程类别管理</h1>

      {isLoading && categories.length === 0 && (
        <div className={styles.loadingIndicator}></div>
      )}
      {error && !isLoading && <div className={styles.error}>{error}</div>}

      {!isLoading && !error && (
        <>
          {/* 表单区域 */}
          <h2 className={styles.sectionTitle}>
            {isEditing ? "编辑类别" : "添加新类别"}
          </h2>
          {formError && (
            <div className={`${styles.message} ${styles.errorMessage}`}>
              {formError}
            </div>
          )}
          <form onSubmit={handleSubmit} className={styles.categoryForm}>
            {/* 名称输入 */}
            <div className={styles.formGroup}>
              <label htmlFor="category-name">类别名称</label>
              <input
                type="text"
                id="category-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="例如: 专业选修"
                disabled={isSubmitting}
                required
              />
            </div>
            {/* 学分输入 */}
            <div className={`${styles.formGroup} ${styles.creditsInput}`}>
              <label htmlFor="category-credits">要求学分</label>
              <input
                type="number"
                id="category-credits"
                value={credits}
                onChange={(e) => setCredits(e.target.value)}
                placeholder="例如: 10"
                min="0"
                step="0.1"
                disabled={isSubmitting}
                required
              />
            </div>
            {/* 操作按钮 */}
            <div className={styles.formActions}>
              <button
                type="submit"
                className={styles.formButton}
                disabled={isSubmitting}
              >
                {isSubmitting
                  ? isEditing
                    ? "更新中..."
                    : "添加中..."
                  : isEditing
                  ? "更新类别"
                  : "添加类别"}
              </button>
              {isEditing && (
                <button
                  type="button"
                  onClick={handleCancelEdit}
                  className={`${styles.formButton} ${styles.cancelButton}`}
                  disabled={isSubmitting}
                >
                  取消
                </button>
              )}
            </div>
          </form>

          {/* 类别列表区域 */}
          {!isLoading && categories.length === 0 && (
            <p>您还没有添加任何课程类别。</p>
          )}
          {categories.length > 0 && ( // 仅当列表不为空时显示标题和列表
            <>
              <h2 className={styles.sectionTitle}>已有类别</h2>
              <ul className={styles.categoriesList}>
                {categories.map((category) => (
                  <li key={category.id} className={styles.categoryItem}>
                    <div className={styles.categoryInfo}>
                      <span className={styles.categoryName}>
                        {category.name}
                      </span>
                      <span className={styles.categoryCredits}>
                        ({category.requiredCredits.toFixed(1)} 学分)
                      </span>
                    </div>
                    <div className={styles.categoryActions}>
                      <button
                        onClick={() => handleEdit(category)}
                        className={styles.actionButton}
                        title="编辑"
                        disabled={isSubmitting}
                      >
                        ✏️
                      </button>
                      <button
                        onClick={() => handleDelete(category.id, category.name)}
                        className={`${styles.actionButton} ${styles.deleteButton}`}
                        title="删除"
                        disabled={isSubmitting}
                      >
                        🗑️
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            </>
          )}
        </>
      )}
    </div>
  );
};

export default CategoriesPage;
