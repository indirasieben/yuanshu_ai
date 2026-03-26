import { useState } from "react";
import { useTranslation } from "react-i18next";
import { X, Info, Check } from "lucide-react";
import { useAuthStore } from "../../stores/authStore";
import YtokenExchangeModal from "./YtokenExchangeModal";

const subscriptionPlans = [
  {
    id: "starter",
    name: "入门版",
    price: "¥35",
    period: "/月",
    ytokens: "500 万",
    features: ["仅 Web 端"],
  },
  {
    id: "basic",
    name: "基础版",
    price: "¥149",
    period: "/月",
    ytokens: "2,500 万",
    features: ["含 API 访问"],
  },
  {
    id: "pro",
    name: "Pro 版",
    price: "¥389",
    period: "/月",
    ytokens: "6,000 万",
    highlight: true,
    badge: "最受欢迎",
    features: ["含 API 访问"],
  },
  {
    id: "professional",
    name: "专业版",
    price: "¥789",
    period: "/月",
    ytokens: "12,000 万",
    features: ["含 API 访问", "优先路由"],
  },
  {
    id: "enterprise",
    name: "企业版",
    price: "¥1,899",
    period: "/月",
    ytokens: "25,000 万",
    features: ["含 API 访问", "专属支持"],
  },
];

export default function SubscriptionModal({ onClose }) {
  const { t, i18n } = useTranslation();
  const { user } = useAuthStore();
  const [showExchange, setShowExchange] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(null);

  const currentQuota =
    user?.quota != null ? (user.quota / 500000).toFixed(0) : "--";
  const currentPlanKey = "入门版";

  const localeTag =
    i18n.language === "en"
      ? "en-US"
      : i18n.language === "zh-TW"
        ? "zh-TW"
        : "zh-CN";

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center">
        <div
          className="absolute inset-0 bg-black/30 backdrop-blur-sm"
          onClick={onClose}
        />
        <div className="relative bg-card rounded-2xl border border-border shadow-xl w-full max-w-4xl mx-4 max-h-[85vh] overflow-y-auto">
          <div className="sticky top-0 bg-card border-b border-border px-6 py-4 flex items-center justify-between rounded-t-2xl z-10">
            <h3 className="text-base font-medium text-ink">{t("选择套餐")}</h3>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-cream-dark text-ink-muted hover:text-ink bg-transparent border-none cursor-pointer transition-colors"
            >
              <X size={16} />
            </button>
          </div>

          <div className="px-6 py-3 bg-cream-light border-b border-border flex flex-wrap items-center gap-6 text-sm">
            <span className="text-ink-muted">
              {t("当前套餐")}
              {": "}
              <span className="text-ink font-medium">{t(currentPlanKey)}</span>
            </span>
            <span className="text-ink-muted">
              {t("剩余 ytoken")}
              {": "}
              <span className="text-ink font-medium">
                {currentQuota}
                {t("万") ? ` ${t("万")}` : ""}
              </span>
            </span>
            {user?.expires_at && (
              <span className="text-ink-muted">
                {t("到期")}
                {": "}
                <span className="text-ink font-medium">
                  {new Date(user.expires_at).toLocaleDateString(localeTag)}
                </span>
              </span>
            )}
          </div>

          <div className="p-6">
            <div className="grid grid-cols-5 gap-3">
              {subscriptionPlans.map((plan) => (
                <div
                  key={plan.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => setSelectedPlan(plan.id)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      setSelectedPlan(plan.id);
                    }
                  }}
                  className={`relative rounded-xl border-2 p-4 cursor-pointer transition-all ${
                    plan.highlight
                      ? selectedPlan === plan.id
                        ? "border-ink bg-ink text-white shadow-lg"
                        : "border-ink bg-ink text-white"
                      : selectedPlan === plan.id
                        ? "border-ink bg-cream-light shadow-md"
                        : "border-border bg-white hover:border-ink/30"
                  }`}
                >
                  {plan.badge && (
                    <span
                      className={`absolute -top-2.5 left-3 px-2 py-0.5 text-[10px] font-medium rounded-full ${
                        plan.highlight
                          ? "bg-accent text-white"
                          : "bg-ink text-white"
                      }`}
                    >
                      {t(plan.badge)}
                    </span>
                  )}
                  <h4
                    className={`text-sm font-medium mb-1 ${plan.highlight ? "text-white" : "text-ink"}`}
                  >
                    {t(plan.name)}
                  </h4>
                  <div className="mb-2">
                    <span
                      className={`text-xl font-bold ${plan.highlight ? "text-white" : "text-ink"}`}
                    >
                      {plan.price}
                    </span>
                    <span
                      className={`text-xs ${plan.highlight ? "text-white/60" : "text-ink-muted"}`}
                    >
                      {t(plan.period)}
                    </span>
                  </div>
                  <p
                    className={`text-xs mb-3 ${plan.highlight ? "text-white/70" : "text-ink-muted"}`}
                  >
                    {t("{{y}} ytoken", { y: plan.ytokens })}
                  </p>
                  <ul className="space-y-1">
                    {plan.features.map((f) => (
                      <li
                        key={f}
                        className={`text-[11px] flex items-center gap-1 ${
                          plan.highlight ? "text-white/70" : "text-ink-muted"
                        }`}
                      >
                        <Check size={10} />
                        {t(f)}
                      </li>
                    ))}
                  </ul>
                  <button
                    type="button"
                    className={`w-full mt-3 py-1.5 rounded-lg text-xs font-medium border-none cursor-pointer transition-colors ${
                      plan.highlight
                        ? "bg-white text-ink hover:bg-cream"
                        : selectedPlan === plan.id
                          ? "bg-ink text-white"
                          : "bg-cream text-ink hover:bg-cream-dark"
                    }`}
                  >
                    {plan.id === "starter"
                      ? t("当前套餐")
                      : t("升级")}
                  </button>
                </div>
              ))}
            </div>

            <div className="mt-6 pt-4 border-t border-border">
              <p className="text-xs text-ink-muted mb-3">{t("支付方式")}</p>
              <div className="flex gap-2">
                {["💳 信用卡", "微信支付", "支付宝"].map((method) => (
                  <button
                    key={method}
                    type="button"
                    className="px-4 py-2 rounded-lg border border-border bg-white text-sm text-ink hover:bg-cream-light cursor-pointer transition-colors"
                  >
                    {t(method)}
                  </button>
                ))}
              </div>
              <p className="text-[11px] text-ink-faint mt-2">
                {t(
                  "⚠️ 在线支付功能即将上线，当前请通过兑换码充值或联系客服",
                )}
              </p>
            </div>

            <div className="mt-4 pt-4 border-t border-border">
              <button
                type="button"
                onClick={() => setShowExchange(true)}
                className="flex items-center gap-1.5 text-sm text-accent hover:text-accent/80 bg-transparent border-none cursor-pointer transition-colors"
              >
                <Info size={14} />
                {t("ytoken 换算说明")}
              </button>
            </div>
          </div>
        </div>
      </div>

      {showExchange && (
        <YtokenExchangeModal onClose={() => setShowExchange(false)} />
      )}
    </>
  );
}
