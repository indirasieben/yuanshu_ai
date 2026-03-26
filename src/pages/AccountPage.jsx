import { useMemo } from "react";
import { Routes, Route, Navigate, NavLink } from "react-router-dom";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  ArrowLeft,
  SlidersHorizontal,
  BarChart3,
  Wallet,
  Bell,
  Building2,
  ScrollText,
} from "lucide-react";
import UsageLogs from "./account/UsageLogs";
import TaskLogs from "./account/TaskLogs";
import UsageStats from "./account/UsageStats";
import PersonalSettings from "./account/PersonalSettings";
import NotificationCenter from "./account/NotificationCenter";
import WalletPage from "./account/WalletPage";
import { useAuthStore } from "../stores/authStore";

function EnterpriseManagement() {
  const { t } = useTranslation();
  return (
    <div>
      <h2 className="text-base font-medium text-ink mb-6">
        {t("企业账号管理")}
      </h2>
      <div className="text-center py-12">
        <Building2 size={28} className="text-ink-faint mx-auto mb-3" />
        <p className="text-sm text-ink-muted">{t("企业版功能即将上线")}</p>
        <p className="text-xs text-ink-faint mt-1 max-w-xs mx-auto">
          {t("支持团队成员管理、统一账单、用量分析等企业级功能，敬请期待")}
        </p>
        <a
          href="mailto:support@metahub-ai.com"
          className="inline-block mt-4 px-4 py-2 rounded-lg bg-cream-dark text-ink text-sm no-underline hover:bg-cream-dark/80 transition-colors"
        >
          {t("联系我们了解详情")}
        </a>
      </div>
    </div>
  );
}

const NAV_DEFS = [
  { path: "usage", labelKey: "用量统计", icon: BarChart3 },
  { path: "wallet", labelKey: "钱包管理", icon: Wallet },
  { path: "notifications", labelKey: "通知中心", icon: Bell },
  { path: "logs", labelKey: "使用日志", icon: ScrollText },
  { path: "settings", labelKey: "个人设置", icon: SlidersHorizontal },
];

export default function AccountPage() {
  const { t } = useTranslation();
  const { user } = useAuthStore();

  const navItems = useMemo(
    () =>
      NAV_DEFS.map((item) => ({
        ...item,
        label: t(item.labelKey),
      })),
    [t],
  );

  return (
    <div className="min-h-screen bg-cream">
      <div className="sticky top-0 z-10 bg-cream-light/90 backdrop-blur-sm border-b border-border">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center gap-4">
          <Link
            to="/chat"
            className="text-ink-muted hover:text-ink transition-colors no-underline flex items-center gap-1 text-sm"
          >
            <ArrowLeft size={16} />
            {t("返回")}
          </Link>
          <h1 className="text-base font-medium text-ink">{t("账号管理")}</h1>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-6 flex gap-8">
        <div className="w-48 shrink-0">
          <div className="mb-6">
            <div className="w-10 h-10 rounded-full bg-ink text-cream-light flex items-center justify-center text-sm font-medium">
              {(user?.display_name || user?.username || "U")[0].toUpperCase()}
            </div>
            <p className="text-sm font-medium text-ink mt-2">
              {user?.display_name || user?.username || t("用户")}
            </p>
            <p className="text-xs text-ink-muted">{user?.email || ""}</p>
          </div>
          <nav className="space-y-1">
            {navItems.map((item) => (
              <NavLink
                key={item.path}
                to={`/account/${item.path}`}
                className={({ isActive }) =>
                  `flex items-center gap-2 px-3 py-2 rounded-lg text-sm no-underline transition-colors ${
                    isActive
                      ? "bg-cream-dark text-ink font-medium"
                      : "text-ink-muted hover:text-ink hover:bg-cream-dark/50"
                  }`
                }
              >
                <item.icon size={14} />
                {item.label}
              </NavLink>
            ))}
          </nav>
        </div>

        <div className="flex-1 bg-card rounded-xl border border-border p-6">
          <Routes>
            <Route index element={<Navigate to="usage" replace />} />
            <Route path="usage" element={<UsageStats />} />
            <Route path="wallet" element={<WalletPage />} />
            <Route path="notifications" element={<NotificationCenter />} />
            <Route path="enterprise" element={<EnterpriseManagement />} />
            <Route path="logs" element={<UsageLogs />} />
            <Route path="task-logs" element={<TaskLogs />} />
            <Route path="settings" element={<PersonalSettings />} />
          </Routes>
        </div>
      </div>
    </div>
  );
}
