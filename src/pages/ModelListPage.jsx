import { useState, useMemo, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import {
  ArrowLeft,
  Search,
  Star,
  Check,
  ChevronDown,
  ChevronUp,
  Copy,
  Link2,
  Coins,
} from "lucide-react";
import { useModelStore } from "../stores/modelStore";
import { copy } from "../helpers/utils";
import toast from "react-hot-toast";
import { API_ENDPOINTS } from "../constants/common.constant";
import { getCurrencyConfig } from "../helpers/render";
import { calculateModelPrice, getModelPriceItems } from "../helpers/utils.jsx";

/** 筛选「全部厂商」的内部值（避免与 i18n 文案耦合） */
const ALL_PROVIDERS_VALUE = "__all__";

/**
 * 字母 A-Z 升序，数字从大到小。
 * 用 token 化方式把字符串拆成「数字段 / 非数字段」来比较。
 */
function tokenizeForAlphaNumSort(input) {
  const s = String(input);
  const tokens = [];
  const re = /(\d+)|([^\d]+)/g;
  let match;
  while ((match = re.exec(s)) !== null) {
    if (match[1] !== undefined) {
      tokens.push({ type: "num", value: Number(match[1]) });
    } else {
      tokens.push({ type: "str", value: match[2].toLowerCase() });
    }
  }
  return tokens;
}

function compareAlphaNumAZDigitDesc(a, b) {
  if (a === b) return 0;
  const ta = tokenizeForAlphaNumSort(a);
  const tb = tokenizeForAlphaNumSort(b);

  const minLen = Math.min(ta.length, tb.length);
  for (let i = 0; i < minLen; i++) {
    const pa = ta[i];
    const pb = tb[i];

    if (pa.type === pb.type) {
      if (pa.type === "str") {
        const r = pa.value.localeCompare(pb.value, "en", {
          sensitivity: "base",
        });
        if (r !== 0) return r;
      } else {
        // 数字从大到小
        if (pa.value !== pb.value) return pb.value - pa.value;
      }
    } else {
      // 兜底：先比较非数字段，再比较数字段
      return pa.type === "str" ? -1 : 1;
    }
  }

  // 前缀相同：token 更短的排前
  return ta.length - tb.length;
}

// 基于后端返回的 supported_endpoint_types 映射到具体 API 路径。
// 你描述的类型类似：['anthropic', 'openai']
// const ENDPOINT_TYPE_MAP = {
//   anthropic: { label: "anthropic", path: "/v1/messages", method: "POST" },
//   openai: { label: "openai", path: "/v1/chat/completions", method: "POST" },
//   // 兜底：其他类型默认走 chat/completions
//   default: { label: "", path: "/v1/chat/completions", method: "POST" },
// };

const ENDPOINT_TYPE_MAP = {
  openai: { label: "openai", path: "/v1/chat/completions", method: "POST" },
  "openai-response": {
    label: "openai-response",
    path: "/v1/responses",
    method: "POST",
  },
  "openai-response-compact": {
    label: "openai-response-compact",
    path: "/v1/responses/compact",
    method: "POST",
  },
  anthropic: { label: "anthropic", path: "/v1/messages", method: "POST" },
  gemini: {
    label: "gemini",
    path: "/v1beta/models/{model}:generateContent",
    method: "POST",
  },
  "jina-rerank": { label: "jina-rerank", path: "/v1/rerank", method: "POST" },
  "image-generation": {
    label: "image-generation",
    path: "/v1/images/generations",
    method: "POST",
  },
  // 兜底：未知类型默认按 OpenAI chat/completions 展示
  default: { label: "", path: "/v1/chat/completions", method: "POST" },
};

function getEndpointTypesForModel(model) {
  const raw = model?.supported_endpoint_types;
  if (!Array.isArray(raw)) return [];
  const normalized = raw
    .map((x) => String(x || "").trim())
    .filter(Boolean)
    .map((x) => x.toLowerCase());

  // 保序去重
  const seen = new Set();
  const unique = [];
  for (const x of normalized) {
    if (seen.has(x)) continue;
    seen.add(x);
    unique.push(x);
  }

  // 只展示后端允许的端点（避免未开放路径）
  return unique.filter((typeKey) => {
    const info = ENDPOINT_TYPE_MAP[typeKey] || ENDPOINT_TYPE_MAP.default;
    return API_ENDPOINTS.includes(info?.path);
  });
}

function getPricingPrefs() {
  const quotaDisplayType = localStorage.getItem("quota_display_type") || "USD";
  const tokenUnit = localStorage.getItem("token_unit") || "M";
  const currency =
    quotaDisplayType === "CNY" || quotaDisplayType === "CUSTOM"
      ? quotaDisplayType
      : "USD";
  return { quotaDisplayType, tokenUnit, currency };
}

export default function ModelListPage() {
  const { t } = useTranslation();
  const { allModels, chatFavorites, addFavorite, removeFavorite, fetchModels } =
    useModelStore();
  const [search, setSearch] = useState("");
  const [filterProvider, setFilterProvider] = useState(ALL_PROVIDERS_VALUE);
  const [expandedId, setExpandedId] = useState(null);

  useEffect(() => {
    fetchModels();
  }, [fetchModels]);

  const providers = useMemo(() => {
    const set = new Set(allModels.map((m) => m.provider));
    return [ALL_PROVIDERS_VALUE, ...Array.from(set)];
  }, [allModels]);

  const filtered = useMemo(() => {
    return allModels.filter((m) => {
      if (
        filterProvider !== ALL_PROVIDERS_VALUE &&
        m.provider !== filterProvider
      )
        return false;
      if (
        search &&
        !m.name.toLowerCase().includes(search.toLowerCase()) &&
        !m.id.toLowerCase().includes(search.toLowerCase())
      )
        return false;
      return true;
    });
  }, [allModels, search, filterProvider]);

  const grouped = useMemo(() => {
    const groups = {};
    filtered.forEach((m) => {
      if (!groups[m.provider]) groups[m.provider] = [];
      groups[m.provider].push(m);
    });
    // 每个分组内：模型按名称排序（字母 A-Z 升序、数字大到小）
    Object.values(groups).forEach((models) => {
      models.sort((a, b) => {
        const r = compareAlphaNumAZDigitDesc(a.name, b.name);
        if (r !== 0) return r;
        return compareAlphaNumAZDigitDesc(a.id, b.id);
      });
    });
    return groups;
  }, [filtered]);

  const copyText = async (e, text) => {
    e.stopPropagation();
    if (await copy(text)) {
      toast.success(t("已复制：" + text));
    } else {
      toast.error(t("无法复制到剪贴板，请手动复制"));
    }
  };

  return (
    <div className="min-h-screen bg-cream">
      {/* 顶部导航 */}
      <div className="sticky top-0 z-10 bg-cream-light/90 backdrop-blur-sm border-b border-border">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center gap-4">
          <Link
            to="/chat"
            className="text-ink-muted hover:text-ink transition-colors no-underline flex items-center gap-1 text-sm"
          >
            <ArrowLeft size={16} />
            {t("返回")}
          </Link>
          <h1 className="text-base font-medium text-ink">{t("模型列表")}</h1>
          <span className="text-xs text-ink-faint ml-auto">
            {t("{{n}} 个模型可用", { n: allModels.length })}
          </span>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-6">
        {/* 搜索和筛选 */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="flex-1 relative">
            <Search
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted"
            />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t("搜索模型名称或 ID...")}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-border bg-card text-ink text-sm outline-none focus:border-ink-muted transition-colors"
            />
          </div>
          <select
            value={filterProvider}
            onChange={(e) => setFilterProvider(e.target.value)}
            className="px-4 py-2.5 rounded-xl border border-border bg-card text-ink text-sm outline-none cursor-pointer"
          >
            {providers.map((p) => (
              <option key={p} value={p}>
                {p === ALL_PROVIDERS_VALUE ? t("厂商: 全部") : p}
              </option>
            ))}
          </select>
        </div>

        {/* 模型列表 */}
        {Object.entries(grouped)
          .sort(([p1], [p2]) => compareAlphaNumAZDigitDesc(p1, p2))
          .map(([provider, models]) => (
            <div key={provider} className="mb-6">
              <h2 className="text-sm font-medium text-ink-muted mb-3">
                {provider}
              </h2>
              <div className="bg-card rounded-xl border border-border divide-y divide-border-light">
                {models.map((model) => {
                  const isFav = chatFavorites.includes(model.id);
                  const isExpanded = expandedId === model.id;
                  return (
                    <div key={model.id}>
                      <div className="flex items-center justify-between px-5 py-4">
                        <div
                          className="flex-1 cursor-pointer"
                          onClick={() =>
                            setExpandedId(isExpanded ? null : model.id)
                          }
                        >
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-ink">
                              {model.name}
                            </span>
                            <button
                              className="text-ink-faint hover:text-ink-muted p-1 bg-transparent border-none cursor-pointer transition-colors"
                              onClick={(e) => {
                                e.stopPropagation();
                                copyText(e, model.id);
                              }}
                            >
                              <Copy size={16} />
                            </button>
                            {model.badge && (
                              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-accent-light text-accent font-medium">
                                {model.badge}
                              </span>
                            )}
                            {model.multimodal && (
                              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-cream-dark text-ink-muted">
                                {t("多模态")}
                              </span>
                            )}
                            {model.contextWindow && (
                              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-cream-dark text-ink-faint">
                                {model.contextWindow}
                              </span>
                            )}
                            {isExpanded ? (
                              <ChevronUp size={12} className="text-ink-faint" />
                            ) : (
                              <ChevronDown
                                size={12}
                                className="text-ink-faint"
                              />
                            )}
                          </div>
                          <p className="text-xs text-ink-faint mt-0.5">
                            {model.id}
                          </p>
                        </div>
                        <button
                          onClick={() =>
                            isFav
                              ? removeFavorite(model.id)
                              : addFavorite(model.id)
                          }
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer transition-colors border-none shrink-0 ${
                            isFav
                              ? "bg-accent-light text-accent"
                              : "bg-cream-dark text-ink-muted hover:bg-cream hover:text-ink"
                          }`}
                        >
                          {isFav ? (
                            <>
                              <Check size={12} /> {t("已添加")}
                            </>
                          ) : (
                            <>
                              <Star size={12} /> {t("添加常用")}
                            </>
                          )}
                        </button>
                      </div>
                      {/* 展开的详情 */}
                      {isExpanded && (
                        <div className="px-5 pb-4 -mt-1">
                          {model.description && (
                            <p className="text-xs text-ink-muted mb-2">
                              {model.description}
                            </p>
                          )}
                          {/* API模型可用端点 */}
                          {(() => {
                            const types = getEndpointTypesForModel(model);
                            if (!types.length) return null;
                            return (
                              <div className="mb-3 rounded-xl border border-border-light bg-cream/50">
                                <div className="flex items-center gap-2 px-3 py-2 border-b border-border-light">
                                  <span className="inline-flex h-6 w-6 items-center justify-center rounded-lg bg-accent-light text-accent">
                                    <Link2 size={14} />
                                  </span>
                                  <div className="min-w-0">
                                    <div className="text-xs font-medium text-ink">
                                      {t("API端点")}
                                    </div>
                                    <div className="text-[11px] text-ink-faint">
                                      {t("模型支持的接口端点信息")}
                                    </div>
                                  </div>
                                </div>
                                <div className="px-3 py-2">
                                  {types.map((typeKey) => {
                                    const info =
                                      ENDPOINT_TYPE_MAP[typeKey] ||
                                      ENDPOINT_TYPE_MAP.default;
                                    if (!info?.path) return null;
                                    const modelName =
                                      model?.model_name || model?.id || "";
                                    const resolvedPath = info.path.includes(
                                      "{model}",
                                    )
                                      ? info.path.replaceAll(
                                          "{model}",
                                          modelName,
                                        )
                                      : info.path;
                                    return (
                                      <div
                                        key={typeKey}
                                        className="flex items-start justify-between gap-3 py-1.5 border-b border-dashed last:border-0 border-border-light"
                                      >
                                        <div className="min-w-0">
                                          <div className="text-xs text-ink-muted">
                                            {info.label || typeKey}
                                            {"："}
                                            <span className="text-ink-faint break-all">
                                              {resolvedPath}
                                            </span>
                                          </div>
                                        </div>
                                        <div className="shrink-0 text-[10px] text-ink-faint">
                                          {info.method || "POST"}
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            );
                          })()}
                          {/* 分组价格 */}
                          {(() => {
                            const enableGroups = Array.isArray(
                              model?.enable_groups,
                            )
                              ? model.enable_groups
                              : [];
                            const groups = enableGroups
                              .map((g) => String(g || "").trim())
                              .filter(Boolean);
                            const displayGroups = groups.filter(
                              (g) => g !== "auto" && g !== "",
                            );
                            if (!displayGroups.length) return null;

                            const { quotaDisplayType, tokenUnit, currency } =
                              getPricingPrefs();
                            const { symbol, rate } = getCurrencyConfig();
                            const displayPrice = (usdAmount) =>
                              `${symbol}${(Number(usdAmount || 0) * rate).toFixed(6)}`;

                            const billingType =
                              model?.quota_type === 0
                                ? t("按量计费")
                                : model?.quota_type === 1
                                  ? t("按次计费")
                                  : "-";
                            const billingPill =
                              billingType === t("按量计费")
                                ? "bg-accent-light text-accent"
                                : billingType === t("按次计费")
                                  ? "bg-cream-dark text-ink-muted"
                                  : "bg-cream-dark text-ink-faint";

                            const showAutoChain =
                              groups.includes("auto") &&
                              groups.includes("default");

                            return (
                              <div className="mb-3 rounded-xl border border-border-light bg-card/30 overflow-hidden">
                                <div className="flex items-center gap-2 px-3 py-2 border-b border-border-light bg-cream/40">
                                  <span className="inline-flex h-6 w-6 items-center justify-center rounded-lg bg-orange-100 text-orange-700">
                                    <Coins size={14} />
                                  </span>
                                  <div className="min-w-0">
                                    <div className="text-xs font-medium text-ink">
                                      {t("分组价格")}
                                    </div>
                                    <div className="text-[11px] text-ink-faint">
                                      {t("不同用户分组的价格信息")}
                                    </div>
                                  </div>
                                </div>

                                {showAutoChain && (
                                  <div className="px-3 py-2 text-[11px] text-ink-muted border-b border-border-light">
                                    <span className="mr-2">
                                      {t("auto分组调用链路")}
                                    </span>
                                    <span className="text-ink-faint">auto</span>
                                    <span className="mx-1 text-ink-faint">
                                      →
                                    </span>
                                    <span className="text-ink-faint">
                                      default{t("分组")}
                                    </span>
                                  </div>
                                )}

                                <div className="overflow-x-auto">
                                  <table className="w-full text-left border-collapse">
                                    <thead>
                                      <tr className="text-[11px] text-ink-faint bg-cream/30">
                                        <th className="px-3 py-2 font-medium">
                                          {t("分组")}
                                        </th>
                                        <th className="px-3 py-2 font-medium">
                                          {t("计费类型")}
                                        </th>
                                        <th className="px-3 py-2 font-medium">
                                          {t("价格摘要")}
                                        </th>
                                      </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border-light">
                                      {displayGroups.map((group) => {
                                        const priceData = calculateModelPrice({
                                          record: model,
                                          selectedGroup: group,
                                          groupRatio: {},
                                          tokenUnit,
                                          displayPrice,
                                          currency,
                                          quotaDisplayType,
                                        });
                                        const items = getModelPriceItems(
                                          priceData,
                                          t,
                                          quotaDisplayType,
                                        );

                                        return (
                                          <tr key={group} className="text-xs">
                                            <td className="px-3 py-2">
                                              <span className="inline-flex items-center rounded-full bg-cream-dark text-ink-muted border border-border-light px-2 py-0.5 text-[11px]">
                                                {group}
                                                {t("分组")}
                                              </span>
                                            </td>
                                            <td className="px-3 py-2">
                                              <span
                                                className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] ${billingPill}`}
                                              >
                                                {billingType}
                                              </span>
                                            </td>
                                            <td className="px-3 py-2">
                                              <div className="space-y-1">
                                                {items.map((item) => (
                                                  <div
                                                    key={item.key}
                                                    className="flex items-center gap-1"
                                                  >
                                                    <div className="font-semibold text-ink-muted">
                                                      {item.label} {item.value}
                                                    </div>
                                                    <div className="text-[11px] text-ink-faint">
                                                      {item.suffix}
                                                    </div>
                                                  </div>
                                                ))}
                                              </div>
                                            </td>
                                          </tr>
                                        );
                                      })}
                                    </tbody>
                                  </table>
                                </div>
                              </div>
                            );
                          })()}

                          {model.capabilities?.length > 0 && (
                            <div className="flex flex-wrap gap-1.5">
                              {model.capabilities.map((cap) => (
                                <span
                                  key={cap}
                                  className="text-[10px] px-2 py-0.5 rounded-full bg-cream text-ink-muted border border-border-light"
                                >
                                  {cap}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}

        {Object.keys(grouped).length === 0 && (
          <div className="text-center py-12 text-ink-muted text-sm">
            {t("未找到匹配的模型")}
          </div>
        )}
      </div>
    </div>
  );
}
