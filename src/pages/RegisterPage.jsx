import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Eye, EyeOff } from "lucide-react";
import { useAuthStore } from "../stores/authStore";
import { api } from "../lib/api";
import toast from "react-hot-toast";
import Turnstile from "react-turnstile";

const AFF_KEY = "aff";
const USERNAME_MAX_LEN = 20;
const PASSWORD_MAX_LEN = 20;

export default function RegisterPage() {
  const { t } = useTranslation();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [verificationLoading, setVerificationLoading] = useState(false);
  const [cooldownSec, setCooldownSec] = useState(0);
  const [turnstileToken, setTurnstileToken] = useState("");
  const { register, isLoading } = useAuthStore();
  const navigate = useNavigate();
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

  let affCode = new URLSearchParams(window.location.search).get("aff");
  if (affCode) {
    localStorage.setItem(AFF_KEY, affCode);
  }

  useEffect(() => {
    if (cooldownSec <= 0) return;
    const timer = setTimeout(() => setCooldownSec((s) => s - 1), 1000);
    return () => clearTimeout(timer);
  }, [cooldownSec]);

  const sendVerificationCode = async () => {
    if (!email.trim()) {
      toast.error(t("请先填写邮箱"));
      return;
    }
    setVerificationLoading(true);
    try {
      await api.get(
        `/api/verification?email=${encodeURIComponent(email.trim())}`,
      );
      toast.success(t("验证码已发送，请查收邮箱"));
      setCooldownSec(30);
    } catch (err) {
      toast.error(err.message || t("发送验证码失败"));
    } finally {
      setVerificationLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (
      !username.trim() ||
      !email ||
      !verificationCode ||
      !password ||
      !confirmPassword
    ) {
      toast.error(t("请填写所有字段"));
      return;
    }
    if (password !== confirmPassword) {
      toast.error(t("两次输入的密码不一致"));
      return;
    }
    if (password.length < 8) {
      toast.error(t("密码至少需要8个字符"));
      return;
    }
    if (
      password.length > PASSWORD_MAX_LEN ||
      confirmPassword.length > PASSWORD_MAX_LEN
    ) {
      toast.error(t("密码不能超过20个字符"));
      return;
    }
    if (username.trim().length > USERNAME_MAX_LEN) {
      toast.error(
        t("用户名不能超过 {{max}} 个字符", { max: USERNAME_MAX_LEN }),
      );
      return;
    }
    if (turnstileEnabled && !turnstileToken) {
      toast.error(t("请先完成人机验证"));
      return;
    }

    if (!affCode) {
      affCode = localStorage.getItem(AFF_KEY);
    }

    const result = await register({
      username: username.trim(),
      password,
      password2: confirmPassword,
      email: email.trim(),
      verification_code: verificationCode.trim(),
      turnstileToken,
      ...(affCode ? { aff_code: affCode } : {}),
    });
    if (result.success) {
      toast.success(t("注册成功！"));
      navigate("/chat", { replace: true });
    } else {
      toast.error(result.error || t("注册失败"));
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-cream px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link to="/" className="inline-block no-underline">
            <h1 className="font-serif text-2xl italic text-ink">
              <img src="/logo.png" alt={t("元枢 AI")} className="h-16 w-auto" />
            </h1>
          </Link>
          <p className="text-ink-muted text-sm mt-2">{t("创建你的账号")}</p>
        </div>

        <div className="bg-card rounded-2xl border border-border p-8">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs text-ink-muted mb-1.5">
                {t("用户名")}
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => {
                  const v = e.target.value;
                  if (v.length > USERNAME_MAX_LEN) {
                    toast.error(
                      t("用户名不能超过 {{max}} 个字符", {
                        max: USERNAME_MAX_LEN,
                      }),
                    );
                  }
                  setUsername(v.slice(0, USERNAME_MAX_LEN));
                }}
                onPaste={(e) => {
                  const text = e.clipboardData?.getData("text") ?? "";
                  if (text.length > USERNAME_MAX_LEN) {
                    toast.error(
                      t("用户名不能超过 {{max}} 个字符", {
                        max: USERNAME_MAX_LEN,
                      }),
                    );
                  }
                }}
                placeholder={t("用于登录的用户名")}
                maxLength={USERNAME_MAX_LEN}
                className="w-full px-4 py-2.5 rounded-xl border border-border bg-cream-light text-ink text-sm outline-none focus:border-ink-muted transition-colors"
                autoComplete="username"
              />
              <p className="text-xs text-right text-ink-muted mt-1.5 pr-2">
                {t("{{cur}}/{{max}}", {
                  cur: username.length,
                  max: USERNAME_MAX_LEN,
                })}
              </p>
            </div>
            <div>
              <label className="block text-xs text-ink-muted mb-1.5">
                {t("密码")}
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={t("至少8个字符")}
                  className="w-full px-4 py-2.5 rounded-xl border border-border bg-cream-light text-ink text-sm outline-none focus:border-ink-muted transition-colors pr-10"
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-muted hover:text-ink bg-transparent border-none cursor-pointer p-0"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
            <div>
              <label className="block text-xs text-ink-muted mb-1.5">
                {t("确认密码")}
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder={t("再次输入密码")}
                className="w-full px-4 py-2.5 rounded-xl border border-border bg-cream-light text-ink text-sm outline-none focus:border-ink-muted transition-colors"
                autoComplete="new-password"
              />
            </div>
            <div>
              <label className="block text-xs text-ink-muted mb-1.5">
                {t("邮箱地址")}
              </label>
              <div className="flex gap-2">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  className="flex-1 min-w-0 px-4 py-2.5 rounded-xl border border-border bg-cream-light text-ink text-sm outline-none focus:border-ink-muted transition-colors"
                  autoComplete="email"
                />
                <button
                  type="button"
                  onClick={sendVerificationCode}
                  disabled={
                    verificationLoading || cooldownSec > 0 || !email.trim()
                  }
                  className="shrink-0 px-3 py-2.5 rounded-xl border border-border bg-cream-light text-ink text-xs font-medium hover:bg-cream transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                >
                  {verificationLoading
                    ? t("发送中…")
                    : cooldownSec > 0
                      ? t("重新发送 ({{sec}})", { sec: cooldownSec })
                      : t("获取验证码")}
                </button>
              </div>
            </div>
            <div>
              <label className="block text-xs text-ink-muted mb-1.5">
                {t("邮箱验证码")}
              </label>
              <input
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value)}
                placeholder={t("请输入邮箱中的验证码")}
                className="w-full px-4 py-2.5 rounded-xl border border-border bg-cream-light text-ink text-sm outline-none focus:border-ink-muted transition-colors"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 rounded-xl bg-ink text-cream-light text-sm font-medium cursor-pointer hover:bg-ink-light transition-colors border-none disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? t("注册中...") : t("注册")}
            </button>
          </form>

          <p className="text-center text-xs text-ink-muted mt-6">
            {t("已有账号？")}{" "}
            <Link
              to="/login"
              className="text-accent hover:text-accent-hover no-underline font-medium"
            >
              {t("立即登录")}
            </Link>
          </p>
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
