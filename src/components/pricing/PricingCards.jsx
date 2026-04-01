import { useTranslation } from "react-i18next";
import { plans } from "../../data/plans";

import {
  formatSubscriptionDuration,
  renderQuota,
  renderQuotaWithoutSymbol,
  getCurrencyConfig,
  renderNumber,
} from "../../helpers";

export default function PricingCards() {
  const { t } = useTranslation();
  const { symbol, rate } = getCurrencyConfig();
  const formattedPrice = (price) => {
    if (price === null) {
      return t("定制");
    }
    return `${symbol}${Number(price * rate).toFixed(2)}`;
  };
  return (
    <section className="py-12">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-5">
          {plans.map((plan) => (
            <div
              key={plan.id}
              className={`relative flex flex-col rounded-2xl p-6 border transition-all ${
                plan.highlight
                  ? "bg-ink text-white border-ink shadow-xl scale-[1.02] z-10"
                  : "bg-white border-border hover:border-ink/20 hover:shadow-md"
              }`}
            >
              {plan.badge && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-accent text-white text-[10px] font-medium rounded-full whitespace-nowrap">
                  {t(plan.badge)}
                </span>
              )}

              <div className="mb-4">
                <h3
                  className={`font-serif text-base font-medium ${plan.highlight ? "text-white" : "text-ink"}`}
                >
                  {t(plan.name)}
                </h3>
                <p
                  className={`text-[11px] mt-0.5 ${plan.highlight ? "text-white/50" : "text-ink-muted"}`}
                >
                  {t(plan.description)}
                </p>
              </div>

              <div className="mb-5">
                <span
                  className={`text-2xl font-serif font-bold ${plan.highlight ? "text-white" : "text-ink"}`}
                >
                  {formattedPrice(plan.price)}
                </span>
                {plan.period && (
                  <span
                    className={`text-xs ${plan.highlight ? "text-white/50" : "text-ink-muted"}`}
                  >
                    {t(plan.period)}
                  </span>
                )}
                {plan.tokens && (
                  <div
                    className={`text-[11px] mt-1 ${plan.highlight ? "text-white/40" : "text-ink-faint"}`}
                  >
                    {t(renderNumber(plan.tokens))} {t(plan.tokensUnit)}
                  </div>
                )}
              </div>

              <ul className="space-y-2 mb-6 flex-1">
                {plan.features.map((f) => (
                  <li
                    key={f}
                    className={`flex items-start gap-2 text-[12px] ${plan.highlight ? "text-white/70" : "text-ink-muted"}`}
                  >
                    <span className="mt-0.5">—</span>
                    <span>{t(f)}</span>
                  </li>
                ))}
              </ul>

              <button
                type="button"
                className={`w-full py-2.5 rounded-full text-[13px] font-medium border-none cursor-pointer transition-colors ${
                  plan.highlight
                    ? "bg-white text-ink hover:bg-cream"
                    : "bg-cream text-ink hover:bg-cream-dark"
                }`}
              >
                {t(plan.cta)}
              </button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
