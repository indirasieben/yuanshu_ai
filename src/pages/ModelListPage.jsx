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
} from "lucide-react";
import { useModelStore } from "../stores/modelStore";

/** 筛选「全部厂商」的内部值（避免与 i18n 文案耦合） */
const ALL_PROVIDERS_VALUE = "__all__";

export default function ModelListPage() {
  const { t } = useTranslation();
  const { allModels, chatFavorites, addFavorite, removeFavorite, fetchModels } =
    useModelStore();
  const [search, setSearch] = useState("");
  const [filterProvider, setFilterProvider] = useState(ALL_PROVIDERS_VALUE);
  const [expandedId, setExpandedId] = useState(null);

  useEffect(() => {
    fetchModels();
  }, []);

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
    return groups;
  }, [filtered]);

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
        {Object.entries(grouped).map(([provider, models]) => (
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
                            <ChevronDown size={12} className="text-ink-faint" />
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
