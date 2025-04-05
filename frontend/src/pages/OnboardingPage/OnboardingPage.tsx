// frontend/src/pages/OnboardingPage/OnboardingPage.tsx
import React, { useState } from "react"; // 移除了 useEffect 和 useCallback，因为此版本不需要
import { useNavigate } from "react-router-dom"; // <-- 1. 导入 useNavigate
import apiClient from "../../services/apiClient";
import styles from "./OnboardingPage.module.css";

// --- 1. 添加 Props 接口 ---
interface OnboardingPageProps {
  onComplete: () => Promise<void>; // 接收一个返回 Promise 的函数
}

// 临时类别数据结构
interface TempCategory {
  id?: number;
  tempId: number;
  name: string;
  requiredCredits: number;
}

// --- 2. 修改组件签名以接收 props ---
const OnboardingPage: React.FC<OnboardingPageProps> = ({ onComplete }) => {
  // <-- 解构 onComplete
  const [step, setStep] = useState<number>(1);
  const [totalCredits, setTotalCredits] = useState<string>("");
  const [categories, setCategories] = useState<TempCategory[]>([]);
  const [newCategoryName, setNewCategoryName] = useState<string>("");
  const [newCategoryCredits, setNewCategoryCredits] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false); // 用于所有 API 调用
  const [error, setError] = useState<string | null>(null);

  const navigate = useNavigate(); // <-- 调用 useNavigate
  const [nextTempId, setNextTempId] = useState(0);

  // --- Step 1 处理 (不变) ---
  const handleTotalCreditsSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    const credits = parseFloat(totalCredits);
    if (isNaN(credits) || credits <= 0) {
      setError("请输入有效的总学分（正数）。");
      return;
    }
    setStep(2);
  };

  // --- Step 2 处理 (不变) ---
  // 添加类别
  const handleAddCategory = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    const name = newCategoryName.trim();
    const credits = parseFloat(newCategoryCredits);

    if (!name) {
      setError("类别名称不能为空。");
      return;
    }
    if (isNaN(credits) || credits < 0) {
      setError("请输入有效的要求学分（非负数）。");
      return;
    }
    if (categories.some((cat) => cat.name === name)) {
      setError("该类别名称已存在。");
      return;
    }

    setIsLoading(true); // 使用 isLoading 代替 isSubmitting
    try {
      const response = await apiClient.post("/categories", {
        name,
        requiredCredits: credits,
      });
      if (response.data && response.data.id) {
        // 将后端返回的完整 category 对象（包含 id）添加到 state
        // 后端返回的 requiredCredits 已经是 number，不需要转换
        const newCat: TempCategory = {
          id: response.data.id, // 存储后端 ID
          name: response.data.name,
          requiredCredits: response.data.requiredCredits,
          tempId: nextTempId, // 使用临时 ID 作为 key
          // 如果后端还返回其他字段，这里会忽略
        };
        setCategories([...categories, newCat]);
        setNextTempId((prev) => prev + 1);
        setNewCategoryName("");
        setNewCategoryCredits("");
      } else {
        setError("添加类别失败：无效响应。");
      }
    } catch (err: unknown) {
      console.error("添加类别 API 错误:", err);
      let message = "添加类别失败，请稍后再试。";
      if (typeof err === "object" && err !== null && "response" in err) {
        const responseErr = err as {
          response?: { data?: { message?: string } };
        };
        if (responseErr.response?.data?.message)
          message = responseErr.response.data.message;
      }
      setError(message);
    } finally {
      setIsLoading(false); // 结束加载
    }
  };

  // 删除类别 (不变)
  const handleDeleteCategory = async (
    idToDelete: number | undefined,
    tempIdToDelete: number
  ) => {
    setError(null);
    if (idToDelete !== undefined) {
      setIsLoading(true);
      try {
        await apiClient.delete(`/categories/${idToDelete}`);
        setCategories(
          categories.filter((cat) => cat.tempId !== tempIdToDelete)
        );
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
      } finally {
        setIsLoading(false);
      }
    } else {
      setCategories(categories.filter((cat) => cat.tempId !== tempIdToDelete));
    }
  };

  // --- 完成整个引导流程 ---
  const handleFinishOnboarding = async () => {
    setError(null);
    const finalTotalCredits = parseFloat(totalCredits);
    if (isNaN(finalTotalCredits) || finalTotalCredits <= 0) {
      setError("总学分无效，请返回上一步修改。");
      return;
    }
    if (categories.length === 0) {
      setError("请至少添加一个课程类别。");
      return;
    }

    setIsLoading(true);
    try {
      const response = await apiClient.put("/auth/complete-onboarding", {
        graduationTotalCredits: finalTotalCredits,
      });

      if (response.status === 200) {
        console.log("引导设置API调用成功!");
        console.log("触发用户信息刷新...");
        await onComplete(); // <--- 3. 调用 App 传来的刷新用户信息函数

        console.log("用户信息已刷新，导航到 dashboard...");
        navigate("/dashboard", { replace: true }); // <--- 4. 在用户信息刷新后导航
        // window.location.href = "/dashboard"; // 不再使用强制刷新
      } else {
        setError("完成设置失败：服务器返回非预期状态。");
        setIsLoading(false); // 错误时需要设置
      }
    } catch (err: unknown) {
      console.error("完成引导 API 错误:", err);
      let message = "完成设置失败，请稍后再试。";
      if (typeof err === "object" && err !== null && "response" in err) {
        const responseErr = err as {
          response?: { data?: { message?: string } };
        };
        if (responseErr.response?.data?.message)
          message = responseErr.response.data.message;
      }
      setError(message);
      setIsLoading(false); // 错误时需要设置
    }
    // finally 块不再需要设置 isLoading(false)，因为成功时页面已跳转
  };

  // --- JSX 结构 (与之前版本基本一致，只是确保了 button 的 disabled 状态) ---
  return (
    <div className={styles.onboardingContainer}>
      <h1 className={styles.title}>首次设置向导</h1>
      <div className={styles.stepIndicator}>步骤 {step} / 2</div>

      {error && !isLoading && (
        <div className={`${styles.message} ${styles.errorMessage}`}>
          {error}
        </div>
      )}

      {/* --- 步骤 1 --- */}
      {step === 1 && (
        <div className={styles.stepContent}>
          <h2 className={styles.stepTitle}>1. 设置毕业总学分</h2>
          <form onSubmit={handleTotalCreditsSubmit}>
            <div className={styles.formGroup}>
              <label htmlFor="totalCredits">毕业要求总学分</label>
              <input
                type="number"
                id="totalCredits"
                value={totalCredits}
                onChange={(e) => setTotalCredits(e.target.value)}
                placeholder="例如 150"
                min="0"
                step="0.1"
                required
              />
            </div>
            <button type="submit" className={styles.navButton}>
              下一步
            </button>
          </form>
        </div>
      )}

      {/* --- 步骤 2 --- */}
      {step === 2 && (
        <div className={styles.stepContent}>
          <h2 className={styles.stepTitle}>2. 添加课程类别及要求学分</h2>
          {categories.length > 0 && (
            <ul className={styles.categoriesList}>
              {categories.map((cat) => (
                <li key={cat.tempId} className={styles.categoryItem}>
                  <span className={styles.name}>{cat.name}</span>
                  <span className={styles.credits}>
                    {cat.requiredCredits.toFixed(1)} 学分
                  </span>{" "}
                  {/* 显示一位小数 */}
                  <button
                    onClick={() => handleDeleteCategory(cat.id, cat.tempId)}
                    className={styles.deleteButton}
                    title={`删除 "${cat.name}"`}
                    disabled={isLoading}
                  >
                    &times;
                  </button>
                </li>
              ))}
            </ul>
          )}
          <form onSubmit={handleAddCategory} className={styles.addCategoryForm}>
            <div className={styles.formGroup}>
              <label htmlFor="categoryName">类别名称</label>
              <input
                type="text"
                id="categoryName"
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                placeholder="例如 专业必修"
                disabled={isLoading}
              />
            </div>
            <div className={`${styles.formGroup} ${styles.creditsInput}`}>
              <label htmlFor="categoryCredits">要求学分</label>
              <input
                type="number"
                id="categoryCredits"
                value={newCategoryCredits}
                onChange={(e) => setNewCategoryCredits(e.target.value)}
                placeholder="例如 70"
                min="0"
                step="0.1"
                disabled={isLoading}
              />
            </div>
            <button
              type="submit"
              className={styles.addButton}
              disabled={isLoading || !newCategoryName || !newCategoryCredits}
            >
              {" "}
              {/* 添加简单禁用条件 */}
              {isLoading ? "添加中..." : "添 加"}
            </button>
          </form>
          <div className={styles.navigationButtons}>
            <button
              onClick={() => setStep(1)}
              className={styles.navButton}
              disabled={isLoading}
            >
              返回上一步
            </button>
            <button
              onClick={handleFinishOnboarding}
              className={styles.navButton}
              disabled={isLoading || categories.length === 0}
            >
              {isLoading ? (
                <div className={styles.loadingIndicator}></div>
              ) : (
                "完成设置"
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default OnboardingPage;
