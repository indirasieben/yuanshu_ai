import { useState, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Layers, Globe, DollarSign, Code } from "lucide-react";

export default function Features() {
  const { t } = useTranslation();
  const [active, setActive] = useState("models");

  const tabs = useMemo(
    () => [
      {
        key: "models",
        labelKey: "多模型聚合",
        titleKey: "一个账号，所有模型",
        descKey:
          "无需分别注册 OpenAI、Anthropic、Google 等多个账号。元枢 AI 聚合 GPT-4o、Claude、Gemini、DeepSeek 等 8+ 顶级模型，一键切换，择优而用。",
        icon: Layers,
        visualKind: "models",
      },
      {
        key: "chinese",
        labelKey: "中文优先",
        titleKey: "为中文用户而生",
        descKey:
          "界面、提示词、客服全面中文化。针对中文理解和生成深度优化，大中华区用户的首选 AI 平台。",
        icon: Globe,
        visualKind: "chinese",
      },
      {
        key: "pricing",
        labelKey: "透明定价",
        titleKey: "用多少，付多少",
        descKey:
          "按 Token 精确计费，无隐藏费用。实时用量面板让成本可控可预测，从免费额度开始体验。",
        icon: DollarSign,
        visualKind: "pricing",
      },
      {
        key: "api",
        labelKey: "API 兼容",
        titleKey: "零改动迁移",
        descKey:
          "兼容 OpenAI API 格式，已有代码只需改个 baseURL 即可迁移。支持流式输出、批量请求、函数调用等全部特性。",
        icon: Code,
        visualKind: "api",
      },
    ],
    [],
  );

  const current = tabs.find((tab) => tab.key === active) || tabs[0];

  const visual = useMemo(() => {
    if (current.visualKind === "models") {
      return (
        <div className="space-y-3">
          {["GPT-4o", "Claude 4 Sonnet", "Gemini 2.5 Pro", "DeepSeek R1"].map(
            (m, i) => (
              <div
                key={m}
                className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${
                  i === 0 ? "border-ink bg-cream-light" : "border-border"
                }`}
              >
                <div className="w-8 h-8 rounded-full bg-ink/5 flex items-center justify-center text-xs font-serif font-bold text-ink">
                  {m[0]}
                </div>
                <span className="text-sm text-ink">{m}</span>
                {i === 0 && (
                  <span className="ml-auto text-[10px] px-2 py-0.5 bg-ink text-white rounded-full">
                    {t("当前")}
                  </span>
                )}
              </div>
            ),
          )}
        </div>
      );
    }
    if (current.visualKind === "chinese") {
      return (
        <div className="p-5 bg-cream-light rounded-xl border border-border">
          <p className="font-serif text-lg text-ink leading-relaxed">
            &quot;{t("请用简洁的语言解释量子纠缠的原理。")}&quot;
          </p>
          <div className="mt-4 pt-4 border-t border-border">
            <p className="text-sm text-ink-muted leading-relaxed">
              {t(
                "量子纠缠是指两个粒子之间存在一种神奇的关联——无论相距多远，对其中一个粒子的测量会瞬间影响另一个粒子的状态...",
              )}
            </p>
          </div>
        </div>
      );
    }
    if (current.visualKind === "pricing") {
      return (
        <div className="space-y-3">
          {[
            {
              labelKey: "本月用量",
              value: "1,284,500",
              unit: "tokens",
              pct: 64,
            },
            {
              labelKey: "剩余额度",
              value: "715,500",
              unit: "tokens",
              pct: 36,
            },
          ].map((item) => (
            <div
              key={item.labelKey}
              className="p-4 bg-cream-light rounded-xl border border-border"
            >
              <div className="flex justify-between text-xs text-ink-muted mb-2">
                <span>{t(item.labelKey)}</span>
                <span>
                  {item.value} {item.unit}
                </span>
              </div>
              <div className="h-1.5 bg-border rounded-full overflow-hidden">
                <div
                  className="h-full bg-ink rounded-full"
                  style={{ width: `${item.pct}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      );
    }
    return (
      <div className="bg-[#1a1a1a] rounded-xl p-5 text-[13px] font-mono leading-relaxed">
        <div className="text-[#888]">{t("// 只需修改一行")}</div>
        <div>
          <span className="text-[#c792ea]">const</span>{" "}
          <span className="text-[#82aaff]">client</span> ={" "}
          <span className="text-[#c792ea]">new</span>{" "}
          <span className="text-[#ffcb6b]">OpenAI</span>
          {"({"}
        </div>
        <div className="pl-4">
          <span className="text-[#82aaff]">baseURL</span>:{" "}
          <span className="text-[#c3e88d]">
            &quot;https://api.metahub-ai.com/v1&quot;
          </span>
          ,
        </div>
        <div className="pl-4">
          <span className="text-[#82aaff]">apiKey</span>:{" "}
          <span className="text-[#c3e88d]">&quot;sk-...&quot;</span>
        </div>
        <div>{"});"}</div>
      </div>
    );
  }, [current.visualKind, t]);

  return (
    <section className="py-24 lg:py-32">
      <div className="max-w-6xl mx-auto px-6 lg:px-8">
        <h2 className="font-serif text-3xl sm:text-4xl lg:text-[42px] font-medium text-ink text-center mb-14 tracking-tight">
          {t("一站式 AI 能力集合")}
        </h2>

        <div className="flex justify-center gap-8 mb-14 border-b border-border">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActive(tab.key)}
              className={`pb-3 text-sm font-medium border-b-2 bg-transparent cursor-pointer transition-all ${
                active === tab.key
                  ? "text-ink border-ink"
                  : "text-ink-muted border-transparent hover:text-ink"
              }`}
            >
              {t(tab.labelKey)}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <div>
            <h3 className="font-serif text-2xl lg:text-3xl font-medium text-ink mb-4">
              {t(current.titleKey)}
            </h3>
            <p className="text-[15px] text-ink-muted leading-relaxed">
              {t(current.descKey)}
            </p>
          </div>
          <div>{visual}</div>
        </div>
      </div>
    </section>
  );
}
