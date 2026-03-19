import { lazy, Suspense, useEffect } from "react";
import { Routes, Route, Navigate, useNavigate } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import toast from "react-hot-toast";
import { useAuthStore } from "./stores/authStore";
import ProtectedRoute from "./components/auth/ProtectedRoute";

// 直接导入高频页面
import LandingPage from "./pages/LandingPage";
import PricingPage from "./pages/PricingPage";

// 懒加载其他页面
const LoginPage = lazy(() => import("./pages/LoginPage"));
const RegisterPage = lazy(() => import("./pages/RegisterPage"));
const ResetPasswordPage = lazy(() => import("./pages/ResetPasswordPage"));
const ChatPage = lazy(() => import("./pages/ChatPage"));
const ModelListPage = lazy(() => import("./pages/ModelListPage"));
const AccountPage = lazy(() => import("./pages/AccountPage"));
const ApiKeysPage = lazy(() => import("./pages/ApiKeysPage"));

function LoadingFallback() {
  return (
    <div className="flex items-center justify-center h-screen bg-cream">
      <div className="text-ink-muted text-sm">加载中...</div>
    </div>
  );
}

export default function App() {
  const { isAuthenticated, fetchSelf } = useAuthStore();
  const navigate = useNavigate();

  // 处理 OAuth 回调 — new-api 在 OIDC 登录成功后会在 URL 中附带 session token
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get("token") || params.get("session");
    if (token) {
      // 保存 token 到 auth store
      useAuthStore.setState({ sessionToken: token, isAuthenticated: true });
      // 清除 URL 中的 token 参数
      window.history.replaceState(
        {},
        "",
        window.location.pathname + window.location.hash,
      );
      // 获取用户信息
      useAuthStore
        .getState()
        .fetchSelf()
        .then(() => {
          toast.success("登录成功");
          navigate("/chat", { replace: true });
        });
      return;
    }
  }, []);

  // 应用启动时，如果有 token 则验证登录状态
  useEffect(() => {
    if (isAuthenticated) {
      fetchSelf();
    }
  }, []);

  return (
    <>
      <Toaster
        position="top-center"
        toastOptions={{
          duration: 3000,
          style: {
            background: "#1A1A1A",
            color: "#F5F3EE",
            fontSize: "13px",
            borderRadius: "8px",
          },
        }}
      />
      <Suspense fallback={<LoadingFallback />}>
        <Routes>
          {/* 公开页面 */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/pricing" element={<PricingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />

          {/* 受保护页面 */}
          <Route element={<ProtectedRoute />}>
            <Route path="/chat" element={<ChatPage />} />
            <Route path="/models" element={<ModelListPage />} />
            <Route path="/api-keys" element={<ApiKeysPage />} />
            <Route path="/account/*" element={<AccountPage />} />
          </Route>

          {/* 未匹配路由 */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </>
  );
}
