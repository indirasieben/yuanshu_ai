import { Link, useLocation } from "react-router-dom";
import { Menu, X, User, LogOut } from "lucide-react";
import { useState, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useAuthStore } from "../../stores/authStore";

export default function Navbar() {
  const { t } = useTranslation();
  const navLinks = useMemo(
    () => [
      { labelKey: "产品", href: "/" },
      { labelKey: "定价", href: "/pricing" },
      { labelKey: "文档", href: "#" },
      { labelKey: "API", href: "#" },
    ],
    [],
  );
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const location = useLocation();
  const { isAuthenticated, user, logout } = useAuthStore();

  return (
    <nav className="sticky top-0 z-50 bg-cream/85 backdrop-blur-md">
      <div className="max-w-6xl mx-auto px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="flex items-center gap-2 no-underline">
            <img src="/logo.png" alt={t("元枢 AI")} className="h-10 w-auto" />
          </Link>

          <div className="hidden md:flex items-center gap-10">
            {navLinks.map((link) => (
              <Link
                key={link.labelKey}
                to={link.href}
                className={`text-[13px] tracking-wide no-underline transition-colors ${
                  location.pathname === link.href
                    ? "text-ink font-medium"
                    : "text-ink-muted hover:text-ink"
                }`}
              >
                {t(link.labelKey)}
              </Link>
            ))}
          </div>

          <div className="hidden md:flex items-center gap-4">
            {isAuthenticated ? (
              <div className="relative">
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-transparent hover:bg-cream-dark border border-border cursor-pointer transition-colors"
                >
                  <div className="w-6 h-6 rounded-full bg-ink text-cream-light flex items-center justify-center text-[11px] font-medium">
                    {(user?.display_name ||
                      user?.username ||
                      "U")[0].toUpperCase()}
                  </div>
                  <span className="text-[13px] text-ink font-medium max-w-[100px] truncate">
                    {user?.display_name || user?.username || t("用户")}
                  </span>
                </button>

                {userMenuOpen && (
                  <>
                    <div
                      className="fixed inset-0 z-10"
                      onClick={() => setUserMenuOpen(false)}
                    />
                    <div className="absolute right-0 top-full mt-2 w-44 bg-white border border-border rounded-xl shadow-lg z-20 py-1">
                      <Link
                        to="/chat"
                        onClick={() => setUserMenuOpen(false)}
                        className="flex items-center gap-2 px-4 py-2 text-[12px] text-ink hover:bg-cream no-underline transition-colors"
                      >
                        {t("进入对话")}
                      </Link>
                      <Link
                        to="/account"
                        onClick={() => setUserMenuOpen(false)}
                        className="flex items-center gap-2 px-4 py-2 text-[12px] text-ink hover:bg-cream no-underline transition-colors"
                      >
                        <User size={13} />
                        {t("账号管理")}
                      </Link>
                      <div className="h-px bg-border mx-2 my-1" />
                      <button
                        onClick={() => {
                          logout();
                          setUserMenuOpen(false);
                        }}
                        className="w-full flex items-center gap-2 px-4 py-2 text-[12px] text-red-600 hover:bg-red-50 bg-transparent border-none cursor-pointer transition-colors"
                      >
                        <LogOut size={13} />
                        {t("退出登录")}
                      </button>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <>
                <Link
                  to="/login"
                  className="text-[13px] text-ink-muted hover:text-ink no-underline transition-colors"
                >
                  {t("登录")}
                </Link>
                <Link
                  to="/register"
                  className="px-5 py-2 bg-ink text-white text-[13px] font-medium rounded-full hover:bg-ink-light transition-colors no-underline"
                >
                  {t("免费注册")}
                </Link>
              </>
            )}
          </div>

          <button
            className="md:hidden p-2 text-ink-muted hover:text-ink bg-transparent border-none cursor-pointer"
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            {mobileOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <div className="md:hidden bg-cream px-6 py-5 space-y-4 border-t border-border">
          {navLinks.map((link) => (
            <Link
              key={link.labelKey}
              to={link.href}
              className="block text-sm text-ink-muted hover:text-ink no-underline"
              onClick={() => setMobileOpen(false)}
            >
              {t(link.labelKey)}
            </Link>
          ))}
          {isAuthenticated ? (
            <>
              <Link
                to="/chat"
                className="inline-block mt-2 px-5 py-2 bg-ink text-white text-sm rounded-full no-underline"
                onClick={() => setMobileOpen(false)}
              >
                {t("进入对话")}
              </Link>
            </>
          ) : (
            <>
              <Link
                to="/login"
                className="block text-sm text-ink-muted hover:text-ink no-underline"
                onClick={() => setMobileOpen(false)}
              >
                {t("登录")}
              </Link>
              <Link
                to="/register"
                className="inline-block mt-2 px-5 py-2 bg-ink text-white text-sm rounded-full no-underline"
                onClick={() => setMobileOpen(false)}
              >
                {t("免费注册")}
              </Link>
            </>
          )}
        </div>
      )}
    </nav>
  );
}
