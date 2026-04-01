/*
Copyright (C) 2025 QuantumNous

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU Affero General Public License as
published by the Free Software Foundation, either version 3 of the
License, or (at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
GNU Affero General Public License for more details.

You should have received a copy of the GNU Affero General Public License
along with this program. If not, see <https://www.gnu.org/licenses/>.

For commercial licensing, please contact support@quantumnous.com
*/

import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import toast from "react-hot-toast";
import { api } from "../lib/api";

const PasswordResetConfirm = () => {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();

  const email = searchParams.get("email") || "";
  const token = searchParams.get("token") || "";
  const isValidResetLink = Boolean(email && token);

  const [loading, setLoading] = useState(false);
  const [newPassword, setNewPassword] = useState("");

  const copyToClipboard = async (text) => {
    const value = String(text ?? "");
    if (!value) return false;

    try {
      await navigator.clipboard.writeText(value);
      return true;
    } catch {
      // 兼容部分浏览器对 navigator.clipboard 的限制
      try {
        const textarea = document.createElement("textarea");
        textarea.value = value;
        textarea.style.position = "fixed";
        textarea.style.left = "-9999px";
        textarea.style.top = "-9999px";
        document.body.appendChild(textarea);
        textarea.focus();
        textarea.select();
        const ok = document.execCommand("copy");
        document.body.removeChild(textarea);
        return ok;
      } catch {
        return false;
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!isValidResetLink) {
      toast.error(t("无效的重置链接，请重新发起密码重置请求"));
      return;
    }

    setLoading(true);
    try {
      // new-api 对应接口：POST /api/user/reset
      const res = await api.post("/api/user/reset", { email, token });

      // 兼容后端返回不同层级：可能是 data.data 或直接 data
      const password = res?.data?.data ?? res?.data;
      const passwordStr = String(password ?? "");

      if (!passwordStr) {
        toast.error(t("重置失败，请稍后再试"));
        return;
      }

      setNewPassword(passwordStr);

      const copied = await copyToClipboard(passwordStr);
      if (copied) {
        toast.success(`${t("密码已重置并已复制到剪贴板：")} ${passwordStr}`);
      } else {
        toast.success(t("密码已重置"));
        toast.error(t("复制失败，请手动复制新密码"));
      }
    } catch (err) {
      toast.error(err?.message || t("重置失败，请稍后再试"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-cream px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link to="/" className="inline-block no-underline">
            <h1 className="font-serif text-2xl italic text-ink">
              <img
                src="/logo.png"
                alt={t("元枢 AI")}
                className="h-16 w-auto"
              />
            </h1>
          </Link>
          <p className="text-ink-muted text-sm mt-2">{t("密码重置确认")}</p>
        </div>

        <div className="bg-card rounded-2xl border border-border p-8">
          {!isValidResetLink && (
            <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-xs text-red-700">
              {t("无效的重置链接，请重新发起密码重置请求")}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs text-ink-muted mb-1.5">
                {t("邮箱")}
              </label>
              <input
                type="email"
                value={email}
                disabled
                placeholder={t("等待获取邮箱信息...")}
                className="w-full px-4 py-2.5 rounded-xl border border-border bg-cream-light text-ink text-sm outline-none focus:border-ink-muted transition-colors"
                autoComplete="email"
              />
            </div>

            {newPassword && (
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs text-ink-muted">
                    {t("新密码")}
                  </label>
                  <button
                    type="button"
                    onClick={async () => {
                      const copied = await copyToClipboard(newPassword);
                      if (copied) {
                        toast.success(
                          `${t("密码已复制到剪贴板：")} ${newPassword}`,
                        );
                      } else {
                        toast.error(t("复制失败，请手动复制新密码"));
                      }
                    }}
                    className="text-xs text-accent hover:text-accent-hover no-underline font-medium"
                  >
                    {t("复制")}
                  </button>
                </div>
                <input
                  type="text"
                  value={newPassword}
                  disabled
                  className="w-full px-4 py-2.5 rounded-xl border border-border bg-cream-light text-ink text-sm outline-none focus:border-ink-muted transition-colors"
                />
              </div>
            )}

            <button
              type="submit"
              disabled={loading || Boolean(newPassword) || !isValidResetLink}
              className="w-full py-3 rounded-xl bg-ink text-cream-light text-sm font-medium cursor-pointer hover:bg-ink-light transition-colors border-none disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading
                ? t("处理中...")
                : newPassword
                  ? t("密码重置完成")
                  : t("确认重置密码")}
            </button>
          </form>

          <div className="text-center mt-6">
            <Link
              to="/login"
              className="text-xs text-ink-muted hover:text-ink no-underline"
            >
              {t("← 返回登录")}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PasswordResetConfirm;
