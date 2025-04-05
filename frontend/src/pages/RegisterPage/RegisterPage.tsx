// frontend/src/pages/RegisterPage/RegisterPage.tsx
import React, { useState } from "react";
import { useNavigate, Link as RouterLink } from "react-router-dom";
import apiClient from "../../services/apiClient"; // 注意路径层级
import styles from "./RegisterPage.module.css"; // 导入样式

const RegisterPage: React.FC = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState(""); // 添加确认密码状态
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null); // 用于显示成功消息
  const navigate = useNavigate();

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null); // 清除旧错误
    setSuccessMessage(null); // 清除旧成功消息

    // --- 客户端验证 ---
    if (!email.endsWith("@pku.edu.cn") && !email.endsWith("@stu.pku.edu.cn")) {
      setError("请输入有效的北京大学邮箱 (@pku.edu.cn 或 @stu.pku.edu.cn)");
      return;
    }
    if (password.length < 6) {
      setError("密码长度至少需要 6 位");
      return;
    }
    if (password !== confirmPassword) {
      setError("两次输入的密码不一致");
      return;
    }
    // --- 结束验证 ---

    setIsLoading(true);
    console.log("尝试注册:", { email });

    try {
      // 调用后端 /api/auth/register 来发送验证码
      const response = await apiClient.post("/auth/register", {
        email,
        password,
      });

      if (response.data && response.data.message) {
        console.log("注册请求发送成功:", response.data.message);
        setSuccessMessage(response.data.message); // 显示后端返回的成功信息
        // 可选：几秒后跳转到验证页面，或者提示用户检查邮箱
        setTimeout(() => {
          // 传递 email 到验证页面是一个好主意
          navigate("/verify-email", { state: { email: email } });
        }, 3000); // 3 秒后跳转
      } else {
        setError("注册请求失败：服务器返回未知响应。");
      }
    } catch (err: unknown) {
      console.error("注册 API 错误:", err);
      let message = "注册失败，请稍后再试。";
      if (typeof err === "object" && err !== null && "response" in err) {
        const responseErr = err as {
          response?: { data?: { message?: string } };
        };
        if (responseErr.response?.data?.message) {
          message = responseErr.response.data.message; // 使用后端错误信息
        }
      }
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={styles.registerContainer}>
      <h1 className={styles.title}>注 册</h1>

      {/* 显示错误或成功消息 */}
      {error && (
        <div className={`${styles.message} ${styles.errorMessage}`}>
          {error}
        </div>
      )}
      {successMessage && (
        <div className={`${styles.message} ${styles.successMessage}`}>
          {successMessage}
        </div>
      )}

      {/* 仅当没有成功消息时显示表单 */}
      {!successMessage && (
        <form onSubmit={handleSubmit} noValidate>
          <div className={styles.formGroup}>
            <label htmlFor="register-email">北大邮箱</label>
            <input
              type="email"
              id="register-email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isLoading}
              placeholder="学号@stu.pku.edu.cn 或 职工邮箱@pku.edu.cn"
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="register-password">设置密码 (至少6位)</label>
            <input
              type="password"
              id="register-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isLoading}
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="register-confirm-password">确认密码</label>
            <input
              type="password"
              id="register-confirm-password"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              disabled={isLoading}
            />
          </div>

          <button
            type="submit"
            className={styles.submitButton}
            disabled={isLoading}
          >
            {isLoading ? (
              <div className={styles.loadingIndicator}></div>
            ) : (
              "发送验证码"
            )}
          </button>
        </form>
      )}

      <div className={styles.switchLink}>
        已经有账户了？ <RouterLink to="/login">立即登录</RouterLink>
      </div>
    </div>
  );
};

export default RegisterPage;
