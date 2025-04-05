// frontend/src/pages/DashboardPage/DashboardPage.tsx
import React, { useState, useEffect } from "react";
import apiClient from "../../services/apiClient"; // 导入 API 客户端
import styles from "./DashboardPage.module.css"; // 导入 CSS Module
import { Link as RouterLink } from "react-router-dom"; // 导入 Link 并使用别名

// --- 定义从后端获取的数据结构 ---
// (需要与 backend/src/services/stats.service.ts 中的 OverallSummary 匹配)
interface CategorySummary {
  id: number;
  name: string;
  requiredCredits: number;
  earnedCredits: number;
  remainingCredits: number;
}

interface DashboardData {
  graduationTotalCredits: number | null;
  totalRequiredFromCategories: number;
  totalEarnedCredits: number;
  totalRemainingCredits: number | null;
  overallGpa: number | null;
  categories: CategorySummary[];
}

// --- Dashboard 组件 ---
const DashboardPage: React.FC = () => {
  // --- State Hooks ---
  const [data, setData] = useState<DashboardData | null>(null); // 存储获取到的统计数据
  const [isLoading, setIsLoading] = useState<boolean>(true); // 初始加载状态
  const [error, setError] = useState<string | null>(null); // 错误信息状态

  // --- Effect Hook: 获取数据 ---
  useEffect(() => {
    // 定义异步函数来获取数据
    const fetchData = async () => {
      setIsLoading(true); // 开始加载
      setError(null); // 清除旧错误

      try {
        const response = await apiClient.get("/stats/summary"); // 调用后端 API
        if (response.data) {
          setData(response.data); // 存储获取到的数据
        } else {
          setError("未能获取到统计数据。");
        }
      } catch (err: unknown) {
        console.error("获取统计数据失败:", err);
        let message = "加载数据时出错，请稍后重试。";
        // 尝试从 Axios 错误提取信息
        if (typeof err === "object" && err !== null && "response" in err) {
          const responseErr = err as {
            response?: { data?: { message?: string } };
          };
          if (responseErr.response?.data?.message) {
            message = responseErr.response.data.message;
          } else if (
            (err as { response?: { status?: number } }).response?.status === 401
          ) {
            // 401 错误可能已被拦截器处理跳转，但如果没有，则显示提示
            message = "请先登录以查看仪表盘。";
          }
        }
        setError(message);
        setData(null); // 清空旧数据
      } finally {
        setIsLoading(false); // 结束加载
      }
    };

    fetchData(); // 组件挂载时执行数据获取

    // 清理函数 (可选)，如果需要在组件卸载时取消请求
    // return () => { /* 取消逻辑 */ };
  }, []); // 空依赖数组表示只在组件首次挂载时运行

  // --- 渲染逻辑 ---

  // 1. 显示加载状态
  if (isLoading) {
    return <div className={styles.loading}>加载中...</div>;
  }

  // 2. 显示错误状态
  if (error) {
    return <div className={styles.error}>错误: {error}</div>;
  }

  // 3. 显示未获取到数据的情况 (理论上应该被 error 覆盖)
  if (!data) {
    return <div className={styles.loading}>未能加载数据。</div>;
  }

  // --- 4. 成功获取数据，渲染仪表盘 ---
  // (根据需要调整 GPA 显示精度)
  const formattedGpa =
    data.overallGpa !== null
      ? data.overallGpa.toFixed(3) // 格式化为 3 位小数的字符串
      : "N/A"; // 如果没有 GPA 显示 N/A

  return (
    <div className={styles.dashboardContainer}>
      <h1 className={styles.title}>学分仪表盘</h1>

      {/* === 添加导航按钮区域 === */}
      <div className={styles.navigationActions}>
        <RouterLink to="/categories">
          <button className={styles.actionButton}>管理课程类别</button>
        </RouterLink>
        <RouterLink to="/courses">
          <button className={`${styles.actionButton} ${styles.primaryButton}`}>
            管理/添加课程
          </button>
        </RouterLink>
      </div>
      {/* === 结束导航按钮区域 === */}
      {/* --- 总体统计卡片 --- */}
      <div className={styles.summaryCard}>
        {/* 毕业要求总学分 */}
        <div className={styles.summaryItem}>
          <div className={styles.summaryLabel}>毕业要求</div>
          <div className={styles.summaryValue}>
            {data.graduationTotalCredits ?? "未设置"}
          </div>
        </div>
        {/* 已获总学分 */}
        <div className={styles.summaryItem}>
          <div className={styles.summaryLabel}>已获学分</div>
          <div className={styles.summaryValue}>
            {data.totalEarnedCredits.toFixed(1)}
          </div>{" "}
          {/* 保留一位小数 */}
        </div>
        {/* 总体剩余学分 */}
        <div className={styles.summaryItem}>
          <div className={styles.summaryLabel}>总体剩余</div>
          <div className={styles.summaryValue}>
            {data.totalRemainingCredits !== null
              ? data.totalRemainingCredits.toFixed(1)
              : "N/A"}
          </div>
        </div>
        {/* 累计 GPA */}
        <div className={styles.summaryItem}>
          <div className={styles.summaryLabel}>累计 GPA</div>
          <div className={`${styles.summaryValue} ${styles.gpa}`}>
            {formattedGpa}
          </div>
        </div>
        {/* (可选) 类别要求总和 */}
        {/* <div className={styles.summaryItem}>
          <div className={styles.summaryLabel}>类别要求总和</div>
          <div className={styles.summaryValue}>{data.totalRequiredFromCategories.toFixed(1)}</div>
        </div> */}
      </div>

      {/* --- 按类别统计 --- */}
      <h2 className={styles.categoriesTitle}>各类别学分统计</h2>
      {data.categories.length === 0 ? (
        <div className={styles.infoBox}>
          您还没有添加任何课程类别。请先在设置中添加类别和要求学分。
        </div>
      ) : (
        <div className={styles.categoriesGrid}>
          {data.categories.map((category) => (
            <div key={category.id} className={styles.categoryCard}>
              <h3 className={styles.categoryName}>{category.name}</h3>
              <div className={styles.categoryDetail}>
                <span className={styles.categoryLabel}>要求学分:</span>
                <span className={styles.categoryValue}>
                  {category.requiredCredits.toFixed(1)}
                </span>
              </div>
              <div className={styles.categoryDetail}>
                <span className={styles.categoryLabel}>已获学分:</span>
                <span className={styles.categoryValue}>
                  {category.earnedCredits.toFixed(1)}
                </span>
              </div>
              <div className={styles.categoryDetail}>
                <span className={styles.categoryLabel}>尚需学分:</span>
                {/* 根据是否完成显示不同颜色 */}
                <span
                  className={`${styles.categoryValue} ${
                    category.remainingCredits <= 0
                      ? styles.complete
                      : styles.remaining
                  }`}
                >
                  {category.remainingCredits.toFixed(1)}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 可以添加其他信息或操作按钮 */}
    </div>
  );
};

export default DashboardPage;
