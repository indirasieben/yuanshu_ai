import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { api } from "../lib/api";
import toast from "react-hot-toast";
import Turnstile from "react-turnstile";

/**
 * 密码重置页面
 *
 * 后端流程说明：
 * 1. GET /api/reset_password?email=xxx  → 后端发送一封含重置链接的邮件
 * 2. 用户点击邮件中的链接（链接指向 New-API 自带页面 /user/reset?email=...&token=...）
 * 3. 用户在 New-API 自带页面完成最终重置操作
 *
 * 因此本页面只负责：输入邮箱 → 触发发送邮件 → 提示用户去邮箱操作
 */
export default function ResetPasswordPage() {
  const { t } = useTranslation();
  const [step, setStep] = useState(1); // 1: 输入邮箱  2: 已发送提示
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState("");
  const status = useMemo(() => {
    try {
      const statusData = localStorage.getItem("status");
      if (!statusData) return {};
      return JSON.parse(statusData) || {};
    } catch {
      return {};
    }
  }, []);
  const turnstileEnabled = Boolean(status?.turnstile_check);
  const turnstileSiteKey = status?.turnstile_site_key || "";

  const handleSendEmail = async (e) => {
    e.preventDefault();
    if (!email) {
      toast.error(t("请输入邮箱"));
      return;
    }
    if (turnstileEnabled && !turnstileToken) {
      toast.error(t("请先完成人机验证"));
      return;
    }
    setIsLoading(true);
    try {
      await api.get(
        `/api/reset_password?email=${encodeURIComponent(email)}&turnstile=${turnstileToken}}`,
      );
      setStep(2);
    } catch (err) {
      toast.error(err.message || t("发送失败，请检查邮箱地址是否已注册"));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-cream px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link to="/" className="inline-block no-underline">
            <h1 className="font-serif text-2xl italic text-ink">
              {t("元枢 AI")}
            </h1>
          </Link>
          <p className="text-ink-muted text-sm mt-2">{t("找回密码")}</p>
        </div>

        <div className="bg-card rounded-2xl border border-border p-8">
          {step === 1 && (
            <form onSubmit={handleSendEmail} className="space-y-4">
              <p className="text-sm text-ink-muted mb-4">
                {t("输入注册邮箱，我们将发送一封密码重置邮件。")}
              </p>
              <div>
                <label className="block text-xs text-ink-muted mb-1.5">
                  {t("邮箱地址")}
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={t("输入注册邮箱")}
                  className="w-full px-4 py-2.5 rounded-xl border border-border bg-cream-light text-ink text-sm outline-none focus:border-ink-muted transition-colors"
                  autoComplete="email"
                />
              </div>
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 rounded-xl bg-ink text-cream-light text-sm font-medium cursor-pointer hover:bg-ink-light transition-colors border-none disabled:opacity-50"
              >
                {isLoading ? t("发送中...") : t("发送重置邮件")}
              </button>
            </form>
          )}

          {step === 2 && (
            <div className="text-center space-y-4">
              <div className="w-12 h-12 rounded-full bg-cream-dark flex items-center justify-center mx-auto mb-2">
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  className="text-ink"
                >
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                  <polyline points="22,6 12,13 2,6" />
                </svg>
              </div>
              <p className="text-sm font-medium text-ink">{t("邮件已发送")}</p>
              <p className="text-xs text-ink-muted leading-relaxed">
                {t(
                  "重置链接已发送到 {{email}}，请查收邮件并点击链接完成密码重置。链接在几分钟内有效。",
                  { email },
                )}
              </p>
              <p className="text-xs text-ink-faint">
                {t("没有收到？请检查垃圾邮件文件夹，或")}{" "}
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="text-ink-muted hover:text-ink underline bg-transparent border-none cursor-pointer p-0"
                >
                  {t("重新发送")}
                </button>
              </p>
            </div>
          )}

          <div className="text-center mt-6">
            <Link
              to="/login"
              className="text-xs text-ink-muted hover:text-ink no-underline"
            >
              {t("← 返回登录")}
            </Link>
          </div>
          {turnstileEnabled && (
            <div className="flex justify-center pt-2">
              <Turnstile
                sitekey={turnstileSiteKey}
                onVerify={(token) => {
                  setTurnstileToken(token);
                }}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
