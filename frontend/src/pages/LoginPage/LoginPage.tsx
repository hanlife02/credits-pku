// frontend/src/pages/LoginPage/LoginPage.tsx
import React, { useState } from "react"; // 导入 React 和 useState Hook
import { useNavigate, Link as RouterLink } from "react-router-dom"; // 导入路由 Hook 和 Link
import apiClient from "../../services/apiClient"; // 导入 API 客户端 (注意路径)
import styles from "./LoginPage.module.css"; // 导入 CSS Module

// 定义传递给组件的 Props 类型，包含登录成功的回调
interface LoginPageProps {
  onLoginSuccess: () => void;
}

// 定义组件，使用 React.FC 并指定 Props 类型
const LoginPage: React.FC<LoginPageProps> = ({ onLoginSuccess }) => {
  // --- State Hooks ---
  const [email, setEmail] = useState(""); // 邮箱输入状态
  const [password, setPassword] = useState(""); // 密码输入状态
  const [isLoading, setIsLoading] = useState(false); // 加载状态
  const [error, setError] = useState<string | null>(null); // 错误信息状态
  const navigate = useNavigate(); // 获取 navigate 函数用于跳转

  // --- 表单提交处理函数 ---
  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault(); // 阻止表单默认的页面刷新行为
    setIsLoading(true); // 开始加载
    setError(null); // 清除之前的错误信息
    console.log("尝试登录:", { email }); // 调试日志

    // 输入验证 (基础示例)
    if (!email || !password) {
      setError("邮箱和密码不能为空。");
      setIsLoading(false);
      return;
    }

    try {
      // 调用后端 API 进行登录
      const response = await apiClient.post("/auth/login", { email, password });

      // 检查响应数据和 token
      if (response.data && response.data.token) {
        console.log("登录成功");
        localStorage.setItem("authToken", response.data.token); // 在 localStorage 中存储 token
        onLoginSuccess(); // 调用从 App 组件传入的回调，更新 App 的登录状态
        navigate("/dashboard", { replace: true }); // 跳转到仪表盘，replace 避免用户回退到登录页
      } else {
        // 后端成功响应但数据格式不符合预期
        setError("登录失败：服务器返回无效响应。");
      }
    } catch (err: unknown) {
      // 处理 API 调用错误
      console.error("登录 API 错误:", err);
      let message = "登录失败，请检查网络连接或稍后再试。"; // 默认错误消息
      // 尝试从 Axios 错误中提取后端返回的错误信息
      if (typeof err === "object" && err !== null && "response" in err) {
        const responseErr = err as {
          response?: { data?: { message?: string } };
        };
        if (responseErr.response?.data?.message) {
          message = responseErr.response.data.message; // 使用后端提供的错误信息
        }
      }
      setError(message); // 设置错误状态以在 UI 中显示
    } finally {
      // 无论成功或失败，最终都结束加载状态
      setIsLoading(false);
    }
  };

  // --- JSX 结构 ---
  return (
    // 使用 CSS Module 类名应用样式
    <div className={styles.loginContainer}>
      <h1 className={styles.title}>登 录</h1>

      {/* 如果有错误信息，则显示 */}
      {error && <div className={styles.errorMessage}>{error}</div>}

      {/* 登录表单，提交时调用 handleSubmit */}
      <form onSubmit={handleSubmit} noValidate>
        {/* 邮箱输入框 */}
        <div className={styles.formGroup}>
          <label htmlFor="login-email">邮箱地址</label>{" "}
          {/* 使用 htmlFor 关联 label 和 input */}
          <input
            type="email"
            id="login-email" // id 应该唯一
            name="email"
            required // HTML5 表单验证
            value={email} // 绑定到 state
            // 为 onChange 添加类型
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setEmail(e.target.value)
            }
            disabled={isLoading} // 加载时禁用
            autoFocus // 页面加载时自动聚焦
            placeholder="your_email@stu.pku.edu.cn"
          />
        </div>

        {/* 密码输入框 */}
        <div className={styles.formGroup}>
          <label htmlFor="login-password">密码</label>
          <input
            type="password"
            id="login-password" // id 应该唯一
            name="password"
            required
            value={password} // 绑定到 state
            // 为 onChange 添加类型
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setPassword(e.target.value)
            }
            disabled={isLoading} // 加载时禁用
            placeholder="********"
          />
        </div>

        {/* 提交按钮 */}
        <button
          type="submit"
          className={styles.submitButton}
          disabled={isLoading} // 加载时禁用
        >
          {/* 根据加载状态显示不同内容 */}
          {isLoading ? (
            <div className={styles.loadingIndicator}></div>
          ) : (
            "登 录"
          )}
        </button>
      </form>

      {/* 切换到注册页的链接 */}
      <div className={styles.switchLink}>
        还没有账户？ <RouterLink to="/register">立即注册</RouterLink>{" "}
        {/* 使用 RouterLink 进行路由跳转 */}
      </div>
    </div>
  );
};

// 默认导出组件
export default LoginPage;
