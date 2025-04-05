// frontend/src/services/apiClient.ts
import axios from "axios";

// 从 .env 文件读取 VITE_ 前缀的环境变量
const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:3001/api";

// 创建 Axios 实例
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// --- 请求拦截器 ---
// 在每个请求发送前，尝试从 localStorage 读取 token 并添加到 Authorization header
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("authToken");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config; // 返回修改后的配置
  },
  (error) => {
    // 处理请求错误
    return Promise.reject(error);
  }
);

// --- 响应拦截器 ---
// 处理响应，特别是 401 Unauthorized 错误
apiClient.interceptors.response.use(
  (response) => {
    // 状态码在 2xx 范围内的任何响应都会触发此函数
    // 不做任何处理，直接返回响应
    return response;
  },
  (error) => {
    // 任何超出 2xx 范围的状态码都会触发此函数
    // 特别处理 401 错误
    if (error.response && error.response.status === 401) {
      console.error("API 请求未授权 (401) - 可能需要登录。");
      // 清除可能已失效的 token
      localStorage.removeItem("authToken");
      // 在实际应用中，这里可以触发登出逻辑或重定向到登录页
      // 为避免循环重定向，检查当前是否已在登录页
      if (window.location.pathname !== "/login") {
        // 可以触发一个全局事件，或者直接跳转
        // window.location.href = '/login'; // 简单粗暴的方式
        // 更好的方式是使用状态管理或路由器的 navigate 功能
        // alert("登录已过期，请重新登录。"); // 临时提示
      }
    }
    // 返回一个被拒绝的 Promise，以便调用方能捕获错误
    return Promise.reject(error);
  }
);

// 导出配置好的 Axios 实例
export default apiClient;
