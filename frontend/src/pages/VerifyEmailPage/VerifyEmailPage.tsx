// frontend/src/pages/VerifyEmailPage/VerifyEmailPage.tsx
import React, { useState, useEffect } from "react";
import { useNavigate, useLocation, Link as RouterLink } from "react-router-dom"; // 引入路由 Hooks
import apiClient from "../../services/apiClient"; // 导入 API 客户端
import styles from "./VerifyEmailPage.module.css"; // 导入样式

// --- 1. 定义 Props 接口 ---
interface VerifyEmailPageProps {
  onVerifySuccess: () => Promise<void>; // 接收一个返回 Promise 的函数
}

// --- 2. 修改组件签名以接收 props ---
const VerifyEmailPage: React.FC<VerifyEmailPageProps> = ({
  onVerifySuccess,
}) => {
  const [code, setCode] = useState(""); // 用于存储输入的 6 位验证码
  const [isLoading, setIsLoading] = useState(false); // 加载状态
  const [error, setError] = useState<string | null>(null); // 错误信息状态
  const [email, setEmail] = useState<string | null>(null); // 存储从路由状态传递过来的 email

  const navigate = useNavigate();
  const location = useLocation(); // 用来获取 navigate 传递的 state

  // --- Effect Hook: 获取 Email (不变) ---
  useEffect(() => {
    if (location.state && location.state.email) {
      setEmail(location.state.email);
    } else {
      console.warn("无法获取用于验证的邮箱地址。");
      setError("无法获取邮箱地址，请重新从注册流程开始。");
    }
  }, [location.state]);

  // --- 表单提交处理 ---
  const handleVerifySubmit = async (
    event: React.FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();
    setError(null);

    if (!email) {
      setError("无法获取邮箱地址，请重新注册。");
      return;
    }
    if (!code || code.length !== 6 || !/^\d{6}$/.test(code)) {
      setError("请输入有效的 6 位数字验证码。");
      return;
    }

    setIsLoading(true);
    console.log("尝试验证邮箱:", { email, code });

    try {
      const response = await apiClient.post("/auth/verify-email", {
        email,
        code,
      });

      if (response.data && response.data.token) {
        console.log("邮箱验证成功!");
        localStorage.setItem("authToken", response.data.token); // 存储 token

        console.log("触发用户信息刷新...");
        await onVerifySuccess(); // <--- 3. 使用传递进来的 prop

        console.log("用户信息应已刷新，导航到 dashboard...");
        navigate("/dashboard", { replace: true }); // 在用户信息刷新后导航
      } else {
        setError("验证失败：服务器返回未知响应。");
      }
    } catch (err: unknown) {
      console.error("验证 API 错误:", err);
      let message = "验证失败，请稍后再试。";
      if (typeof err === "object" && err !== null && "response" in err) {
        const responseErr = err as {
          response?: { data?: { message?: string } };
        };
        if (responseErr.response?.data?.message) {
          message = responseErr.response.data.message;
        }
      }
      setError(message);
      setCode("");
    } finally {
      setIsLoading(false);
    }
  };

  // --- JSX 结构 (基本不变) ---
  return (
    <div className={styles.verifyContainer}>
      <h1 className={styles.title}>验证您的邮箱</h1>
      <p className={styles.prompt}>
        我们已向 <strong>{email || "您的邮箱"}</strong> 发送了一个 6
        位数的验证码。请输入：
      </p>
      {error && (
        <div className={`${styles.message} ${styles.errorMessage}`}>
          {error}
        </div>
      )}
      <form onSubmit={handleVerifySubmit} noValidate>
        <div className={styles.formGroup}>
          <label htmlFor="verify-code" style={{ display: "none" }}>
            验证码
          </label>
          <input
            type="text"
            inputMode="numeric"
            pattern="\d{6}"
            maxLength={6}
            id="verify-code"
            required
            value={code}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setCode(e.target.value.replace(/[^0-9]/g, ""))
            }
            disabled={isLoading || !email}
            placeholder="______"
            autoFocus
          />
        </div>
        <button
          type="submit"
          className={styles.submitButton}
          disabled={isLoading || !email || code.length !== 6}
        >
          {isLoading ? (
            <div className={styles.loadingIndicator}></div>
          ) : (
            "验 证"
          )}
        </button>
      </form>
      <p style={{ textAlign: "center", marginTop: "1rem", fontSize: "0.9rem" }}>
        <RouterLink to="/login">返回登录</RouterLink>
      </p>
    </div>
  );
};

export default VerifyEmailPage;
