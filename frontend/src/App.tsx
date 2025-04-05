// frontend/src/App.tsx
import React, { useState, useEffect, useCallback } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Link,
  Navigate,
  // useNavigate, // App 本身不直接使用
  useLocation,
} from "react-router-dom";
import styles from "./App.module.css";
import apiClient from "./services/apiClient";

// --- 导入页面组件 ---
import LoginPage from "./pages/LoginPage/LoginPage";
import RegisterPage from "./pages/RegisterPage/RegisterPage";
import VerifyEmailPage from "./pages/VerifyEmailPage/VerifyEmailPage";
import DashboardPage from "./pages/DashboardPage/DashboardPage";
import OnboardingPage from "./pages/OnboardingPage/OnboardingPage";
import CategoriesPage from "./pages/CategoriesPage/CategoriesPage"; // <--- 导入 CategoriesPage
import CoursesPage from "./pages/CoursesPage/CoursesPage"; // <--- 导入 CoursesPage
// import NotFoundPage from './pages/NotFoundPage';

// --- 用户信息 State 接口 ---
interface User {
  id: number;
  email: string;
  hasCompletedSetup: boolean;
  graduationTotalCredits: number | null;
}

// --- 路由守卫: 检查 Token ---
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const token = localStorage.getItem("authToken");
  const location = useLocation(); // 移到顶层

  if (!token) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  return <>{children}</>;
};

// --- 应用根组件 ---
function App() {
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(
    !!localStorage.getItem("authToken")
  );
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState<boolean>(true);

  // --- 获取当前用户信息的函数 (用 useCallback 封装) ---
  const fetchUserInfo = useCallback(async (isInitialLoad = false) => {
    // 只有在初始加载时才设置 authLoading 为 true，避免后续刷新时页面闪烁
    if (isInitialLoad) {
      setAuthLoading(true);
    }
    const token = localStorage.getItem("authToken"); // 再次获取 token 以防万一
    if (!token) {
      setIsLoggedIn(false);
      setCurrentUser(null);
      if (isInitialLoad) setAuthLoading(false);
      return; // 没有 token 直接返回
    }

    console.log("尝试获取用户信息...");
    try {
      const response = await apiClient.get<User>("/auth/me");
      if (response.data) {
        console.log("用户信息获取成功:", response.data);
        setCurrentUser(response.data);
        setIsLoggedIn(true);
      } else {
        throw new Error("No user data returned");
      }
    } catch (error: unknown) {
      // <--- 修改为 unknown
      console.error("获取用户信息失败:", error);
      // 进行类型检查以安全地访问属性
      let status: number | undefined;
      if (typeof error === "object" && error !== null && "response" in error) {
        const axiosError = error as { response?: { status?: number } }; // 类型断言
        status = axiosError.response?.status;
      }

      if (status !== 401) {
        // 只有在不是 401 时才清除 token
        localStorage.removeItem("authToken");
        setIsLoggedIn(false);
        setCurrentUser(null);
      } else {
        // 如果是 401，拦截器会处理，但我们确保本地状态也更新
        setIsLoggedIn(false);
        setCurrentUser(null);
      }
    } finally {
      if (isInitialLoad) setAuthLoading(false); // 初始加载完成后结束 loading
    }
  }, []); // 空依赖数组，函数本身不会经常变化

  // --- 初始加载获取用户信息 ---
  useEffect(() => {
    fetchUserInfo(true); // 传递 true 表示是初始加载
  }, [fetchUserInfo]); // 依赖 fetchUserInfo

  // --- 登录成功回调 ---
  const handleLoginSuccess = useCallback(async () => {
    console.log("登录成功回调，刷新用户信息...");
    setIsLoggedIn(true); // 先更新登录状态
    await fetchUserInfo(); // 调用获取用户信息函数 (非初始加载)
    // 重定向由 LoginPage 完成
  }, [fetchUserInfo]); // 依赖 fetchUserInfo

  // --- 验证成功回调 (与登录类似) ---
  const handleVerifySuccess = useCallback(async () => {
    console.log("验证成功回调，刷新用户信息...");
    setIsLoggedIn(true); // 先更新登录状态
    await fetchUserInfo(); // 调用获取用户信息函数
    // 重定向由 VerifyEmailPage 完成
  }, [fetchUserInfo]);

  // --- 引导完成回调 (与登录类似) ---
  const handleOnboardingComplete = useCallback(async () => {
    console.log("引导完成回调，刷新用户信息...");
    // 不需要设置 isLoggedIn，因为已经是 true
    await fetchUserInfo(); // 调用获取用户信息函数
    // 重定向由 OnboardingPage 完成
  }, [fetchUserInfo]);

  // --- 登出处理 ---
  const handleLogout = useCallback(() => {
    console.log("登出...");
    localStorage.removeItem("authToken");
    setIsLoggedIn(false);
    setCurrentUser(null);
    window.location.replace("/login");
  }, []);

  // --- 渲染逻辑 ---
  if (authLoading) {
    return (
      <div style={{ padding: "2rem", textAlign: "center" }}>应用加载中...</div>
    );
  }

  return (
    <Router>
      <div className={styles.appContainer}>
        {/* --- 导航栏 --- */}
        <nav className={styles.navbar}>
          <div>
            <Link
              to={
                // 导航目标依赖于登录和设置状态
                isLoggedIn
                  ? currentUser?.hasCompletedSetup
                    ? "/dashboard" // 已登录且完成设置 -> 仪表盘
                    : "/onboarding" // 已登录但未完成设置 -> 引导页
                  : "/login" // 未登录 -> 登录页
              }
              className={styles.navBrandLink}
            >
              学分审查
            </Link>
          </div>
          <div className={styles.navLinks}>
            {!isLoggedIn ? ( // 未登录状态
              <>
                <Link to="/login">登录</Link>
                <Link to="/register">注册</Link>
              </>
            ) : (
              // 已登录状态
              <>
                <Link to="/dashboard">仪表盘</Link>
                <Link to="/courses">课程管理</Link>
                <Link to="/categories">类别管理</Link>
                <button onClick={handleLogout} className={styles.logoutButton}>
                  登出
                </button>
              </>
            )}
          </div>
        </nav>

        {/* --- 主内容区域 --- */}
        <main className={styles.mainContent}>
          <Routes>
            {/* --- 公开路由 --- */}
            {/* 如果已登录，访问这些页面则重定向到根路径 */}
            <Route
              path="/login"
              element={
                !isLoggedIn ? (
                  <LoginPage onLoginSuccess={handleLoginSuccess} />
                ) : (
                  <Navigate to="/" replace />
                )
              }
            />
            <Route
              path="/register"
              element={
                !isLoggedIn ? <RegisterPage /> : <Navigate to="/" replace />
              }
            />
            <Route
              path="/verify-email"
              element={
                !isLoggedIn ? (
                  <VerifyEmailPage onVerifySuccess={handleVerifySuccess} />
                ) : (
                  <Navigate to="/" replace />
                )
              }
            />

            {/* --- 受保护的路由 (需要登录 Token) --- */}
            {/* Onboarding 路由: 登录后 & 未完成设置 */}
            <Route
              path="/onboarding"
              element={
                <ProtectedRoute>
                  {currentUser?.hasCompletedSetup === true ? (
                    <Navigate to="/dashboard" replace />
                  ) : (
                    <OnboardingPage onComplete={handleOnboardingComplete} />
                  )}
                </ProtectedRoute>
              }
            />

            {/* Dashboard 路由: 登录后 & 已完成设置 */}
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  {currentUser?.hasCompletedSetup === false ? (
                    <Navigate to="/onboarding" replace />
                  ) : (
                    <DashboardPage />
                  )}
                </ProtectedRoute>
              }
            />

            {/* Categories 路由: 登录后 & 已完成设置 */}
            <Route
              path="/categories"
              element={
                <ProtectedRoute>
                  {currentUser?.hasCompletedSetup === false ? (
                    <Navigate to="/onboarding" replace />
                  ) : (
                    <CategoriesPage />
                  )}
                </ProtectedRoute>
              }
            />

            {/* Courses 路由: 登录后 & 已完成设置 */}
            <Route
              path="/courses"
              element={
                <ProtectedRoute>
                  {currentUser?.hasCompletedSetup === false ? (
                    <Navigate to="/onboarding" replace />
                  ) : (
                    <CoursesPage />
                  )}
                </ProtectedRoute>
              }
            />

            {/* --- 根路径处理 --- */}
            <Route
              path="/"
              element={
                isLoggedIn ? (
                  currentUser?.hasCompletedSetup ? (
                    <Navigate to="/dashboard" replace />
                  ) : (
                    <Navigate to="/onboarding" replace />
                  )
                ) : (
                  <Navigate to="/login" replace />
                )
              }
            />

            {/* (可选) 404 路由，放在最后 */}
            {/* <Route path="*" element={<NotFoundPage />} /> */}
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
