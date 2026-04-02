import { lazy, Suspense, useEffect, useRef } from "react";
import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Toaster } from "react-hot-toast";
import { Loader2 } from "lucide-react";
import { useAuthStore } from "./stores/authStore";
import { useStatusStore } from "./stores/statusStore";
import ProtectedRoute from "./components/auth/ProtectedRoute";
import ConfirmModal from "./components/common/ConfirmModal";

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
const ResetPasswordConfirmPage = lazy(
  () => import("./pages/ResetPasswordConfirmPage"),
);
const OAuthCallbackPage = lazy(() => import("./pages/OAuthCallbackPage"));

function LoadingFallback() {
  const { t } = useTranslation();
  return (
    <div className="flex items-center justify-center h-screen bg-cream">
      <div className="flex flex-col items-center justify-center gap-2">
        <Loader2 className="animate-spin text-ink-muted" size={20} />
        <div className="text-ink-muted text-sm">{t("加载中…")}</div>
      </div>
    </div>
  );
}

export default function App() {
  useTranslation();
  const { isAuthenticated, fetchSelf, user } = useAuthStore();
  const { fetchStatus } = useStatusStore();
  const location = useLocation();
  const prevPathRef = useRef(location.pathname);
  const fetchedSelfForUserRef = useRef(null);

  // 应用启动时，如果有 token 则验证登录状态
  useEffect(() => {
    const pathname = location.pathname;
    const shouldFetchSelf =
      pathname.startsWith("/chat") ||
      pathname.startsWith("/models") ||
      pathname.startsWith("/api-keys") ||
      pathname.startsWith("/account");

    if (isAuthenticated) {
      if (shouldFetchSelf) {
        const uid = user?.id ?? "__pending__";
        if (fetchedSelfForUserRef.current !== uid) {
          fetchedSelfForUserRef.current = uid;
          void fetchSelf();
        }
      }
    } else {
      fetchedSelfForUserRef.current = null;
    }
  }, [isAuthenticated, fetchSelf, location.pathname, user?.id]);

  // 站点打开的第一次请求拉取系统状态（包含公开页面）
  useEffect(() => {
    void fetchStatus();
  }, [fetchStatus]);

  // 切换到 /account/settings 时强制刷新一次
  useEffect(() => {
    const normalize = (p) => String(p || "").replace(/\/+$/, "") || "/";
    const prev = normalize(prevPathRef.current);
    const next = normalize(location.pathname);
    prevPathRef.current = location.pathname;

    if (next === "/account/settings" && prev !== "/account/settings") {
      void fetchStatus({ force: true });
    }
  }, [location.pathname, fetchStatus]);

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
      <ConfirmModal />
      <Suspense fallback={<LoadingFallback />}>
        <Routes>
          {/* 公开页面 */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/pricing" element={<PricingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
          <Route path="/user/reset" element={<ResetPasswordConfirmPage />} />
          <Route path="/oauth/callback" element={<OAuthCallbackPage />} />

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
