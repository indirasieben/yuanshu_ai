import { useEffect } from "react";
import toast from "react-hot-toast";
import { useTranslation } from "react-i18next";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuthStore } from "../stores/authStore";

export default function OAuthCallbackPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const token = searchParams.get("token") || searchParams.get("session");

    if (!token) {
      navigate("/login", { replace: true });
      return;
    }

    // 保存 token 到 auth store，确保后续请求 New-Api-User header 可用
    useAuthStore.setState({ sessionToken: token, isAuthenticated: true });

    // 拉取用户信息；失败时 api.js 会统一跳转到 /login
    useAuthStore
      .getState()
      .fetchSelf()
      .then(() => {
        toast.success(t("登录成功"));
        navigate("/chat", { replace: true });
      })
      .catch(() => {
        navigate("/login", { replace: true });
      });
  }, [navigate, searchParams, t]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-cream px-4">
      <div className="text-ink-muted text-sm">{t("加载中…")}</div>
    </div>
  );
}

