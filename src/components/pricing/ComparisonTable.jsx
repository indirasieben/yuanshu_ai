import { Fragment, useState } from "react";
import { useTranslation } from "react-i18next";
import { ChevronDown, Check, X } from "lucide-react";
import { comparisonFeatures, plans } from "../../data/plans";

const planKeys = ["starter", "basic", "pro", "professional", "enterprise"];

function CellValue({ value, t }) {
  if (value === true)
    return <Check size={14} className="text-ink mx-auto" />;
  if (value === false)
    return <X size={14} className="text-border mx-auto" />;
  if (typeof value === "string") {
    return (
      <span className="text-[13px] text-ink">{t(value)}</span>
    );
  }
  return <span className="text-[13px] text-ink">{value}</span>;
}

export default function ComparisonTable() {
  const { t } = useTranslation();
  const [expanded, setExpanded] = useState(false);

  const planNames = plans.reduce(
    (acc, p) => ({ ...acc, [p.id]: p.name }),
    {},
  );

  return (
    <section className="py-12">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <button
          type="button"
          onClick={() => setExpanded(!expanded)}
          className="flex items-center gap-2 mx-auto px-6 py-2.5 text-[13px] font-medium text-ink bg-transparent border border-border hover:border-ink/30 rounded-full cursor-pointer transition-all"
        >
          {expanded ? t("收起功能对比表") : t("展开功能对比表")}
          <ChevronDown
            size={14}
            className={`transition-transform ${expanded ? "rotate-180" : ""}`}
          />
        </button>

        {expanded && (
          <div className="mt-8 overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr>
                  <th className="text-left p-3 text-[12px] font-medium text-ink-muted bg-cream rounded-tl-xl min-w-[160px] uppercase tracking-wider">
                    {t("功能")}
                  </th>
                  {planKeys.map((key, i) => (
                    <th
                      key={key}
                      className={`text-center p-3 text-[12px] font-medium bg-cream min-w-[100px] uppercase tracking-wider ${
                        key === "pro" ? "text-ink font-semibold" : "text-ink-muted"
                      } ${i === planKeys.length - 1 ? "rounded-tr-xl" : ""}`}
                    >
                      {t(planNames[key])}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {comparisonFeatures.map((category) => (
                  <Fragment key={category.category}>
                    <tr>
                      <td
                        colSpan={6}
                        className="px-3 pt-5 pb-2 text-[11px] font-medium text-ink-muted uppercase tracking-widest"
                      >
                        {t(category.category)}
                      </td>
                    </tr>
                    {category.features.map((feature) => (
                      <tr
                        key={feature.name}
                        className="border-b border-border-light hover:bg-cream/30"
                      >
                        <td className="p-3 text-[13px] text-ink-muted">
                          {t(feature.name)}
                        </td>
                        {planKeys.map((key) => (
                          <td key={key} className="p-3 text-center">
                            <CellValue value={feature[key]} t={t} />
                          </td>
                        ))}
                      </tr>
                    ))}
                  </Fragment>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  );
}
