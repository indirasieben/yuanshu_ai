import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ArrowRight } from "lucide-react";
import { plans } from "../../data/plans";
import {
  formatSubscriptionDuration,
  renderQuota,
  renderQuotaWithoutSymbol,
  getCurrencyConfig,
  renderNumber,
} from "../../helpers";

export default function PricingPreview() {
  const { t } = useTranslation();
  const previewPlans = plans.filter((p) =>
    ["starter", "pro", "enterprise"].includes(p.id),
  );
  const { symbol, rate } = getCurrencyConfig();
  const formattedPrice = (price) => {
    if (price === null) {
      return t("定制");
    }
    return `${symbol}${Number(price * rate).toFixed(2)}`;
  };
  return (
    <section className="py-24 lg:py-32 bg-white/40">
      <div className="max-w-5xl mx-auto px-6 lg:px-8">
        <h2 className="font-serif text-3xl sm:text-4xl lg:text-[42px] font-medium text-ink text-center mb-4 tracking-tight">
          {t("简单透明的定价")}
        </h2>
        <p className="text-center text-[15px] text-ink-muted mb-16">
          {t("从免费开始，按需升级，无隐藏费用")}
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {previewPlans.map((plan) => (
            <div
              key={plan.id}
              className={`relative p-7 rounded-2xl border transition-all ${
                plan.highlight
                  ? "bg-ink text-white border-ink"
                  : "bg-white border-border hover:border-ink/20"
              }`}
            >
              {plan.badge && (
                <span className="absolute -top-3 left-6 px-3 py-1 bg-accent text-white text-[11px] font-medium rounded-full">
                  {t(plan.badge)}
                </span>
              )}
              <h3
                className={`font-serif text-lg font-medium mb-1 ${plan.highlight ? "text-white" : "text-ink"}`}
              >
                {t(plan.name)}
              </h3>
              <p
                className={`text-xs mb-5 ${plan.highlight ? "text-white/60" : "text-ink-muted"}`}
              >
                {t(plan.description)}
              </p>
              <div className="mb-6">
                <span
                  className={`text-3xl font-serif font-bold ${plan.highlight ? "text-white" : "text-ink"}`}
                >
                  {formattedPrice(plan.price)}
                </span>
                {plan.period && (
                  <span
                    className={`text-sm ${plan.highlight ? "text-white/60" : "text-ink-muted"}`}
                  >
                    {t(plan.period)}
                  </span>
                )}
              </div>
              <ul className="space-y-2 mb-7">
                {plan.features.slice(0, 4).map((f) => (
                  <li
                    key={f}
                    className={`flex items-start gap-2 text-[13px] ${plan.highlight ? "text-white/80" : "text-ink-muted"}`}
                  >
                    <span className="mt-1">—</span>
                    <span>{t(f)}</span>
                  </li>
                ))}
              </ul>
              <Link
                to={plan.highlight ? "/chat" : "/pricing"}
                className={`block text-center py-2.5 rounded-full text-sm font-medium no-underline transition-colors ${
                  plan.highlight
                    ? "bg-white text-ink hover:bg-cream"
                    : "bg-cream text-ink hover:bg-cream-dark"
                }`}
              >
                {t(plan.cta)}
              </Link>
            </div>
          ))}
        </div>

        <div className="text-center mt-12">
          <Link
            to="/pricing"
            className="inline-flex items-center gap-1.5 text-ink text-sm font-medium no-underline border-b border-ink/30 hover:border-ink pb-0.5 transition-colors"
          >
            {t("查看全部方案")} <ArrowRight size={13} />
          </Link>
        </div>
      </div>
    </section>
  );
}
