import { useState, useEffect, useCallback } from "react";
import { useTranslation } from "react-i18next";
import {
  Search,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
  Clock,
  Zap,
  Activity,
} from "lucide-react";
import { api } from "../../lib/api";
import { renderQuota } from "../../helpers";

const LOG_TYPE_DEFS = [
  { value: 0, labelKey: "全部", color: "" },
  { value: 1, labelKey: "充值", color: "bg-cyan-100 text-cyan-700" },
  { value: 2, labelKey: "消费", color: "bg-lime-100 text-lime-700" },
  { value: 3, labelKey: "管理", color: "bg-orange-100 text-orange-700" },
  { value: 4, labelKey: "系统", color: "bg-purple-100 text-purple-700" },
  { value: 5, labelKey: "错误", color: "bg-red-100 text-red-700" },
  { value: 6, labelKey: "退款", color: "bg-teal-100 text-teal-700" },
];

function getTypeInfo(typeVal) {
  return LOG_TYPE_DEFS.find((x) => x.value === typeVal) || LOG_TYPE_DEFS[0];
}

function formatTime(ts, localeTag = "zh-CN") {
  if (!ts) return "--";
  const d = new Date(ts * 1000);
  return d
    .toLocaleString(localeTag, {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    })
    .replace(/\//g, "-");
}

function toUnixSec(datetimeLocal) {
  if (!datetimeLocal) return undefined;
  return Math.floor(new Date(datetimeLocal).getTime() / 1000);
}

function todayStart() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return toDatetimeLocal(d);
}

function nowPlusOneHour() {
  const d = new Date(Date.now() + 3600 * 1000);
  return toDatetimeLocal(d);
}

function toDatetimeLocal(date) {
  const pad = (n) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

const PAGE_SIZES = [10, 20, 50];

function StatCard(props) {
  const { icon: Icon, label, value, loading, accent } = props;
  return (
    <div className="bg-card rounded-xl border border-border p-4 flex items-start gap-3">
      <div className={`mt-0.5 p-2 rounded-lg ${accent}`}>
        <Icon size={14} />
      </div>
      <div>
        <p className="text-xs text-ink-muted">{label}</p>
        {loading ? (
          <div className="h-5 w-16 bg-cream-dark rounded-md mt-1 animate-pulse" />
        ) : (
          <p className="text-base font-medium text-ink mt-0.5">{value}</p>
        )}
      </div>
    </div>
  );
}

function TypeBadge({ typeVal, t }) {
  const info = getTypeInfo(typeVal);
  if (!info.color)
    return <span className="text-xs text-ink-muted">{t(info.labelKey)}</span>;
  return (
    <span
      className={`inline-block px-2 py-0.5 rounded-md text-xs font-medium ${info.color}`}
    >
      {t(info.labelKey)}
    </span>
  );
}

function buildExpandItems(log, t, renderQuotaFn) {
  let other = {};
  try {
    other = JSON.parse(log.other || "{}");
  } catch {
    void 0;
  }
  const items = [];
  if (log.request_id)
    items.push({ label: "Request ID", value: log.request_id });
  if (other.upstream_model_name)
    items.push({
      label: t("实际模型"),
      value: other.upstream_model_name,
    });
  if (other.request_path)
    items.push({ label: t("请求路径"), value: other.request_path });
  if (other.frt)
    items.push({
      label: t("首字时间"),
      value: `${other.frt} ms`,
    });
  if (other.cache_tokens > 0)
    items.push({
      label: t("缓存读 Tokens"),
      value: other.cache_tokens,
    });
  if (other.cache_creation_tokens > 0)
    items.push({
      label: t("缓存写 Tokens"),
      value: other.cache_creation_tokens,
    });
  if (other.group_ratio != null)
    items.push({
      label: t("分组倍率"),
      value: `× ${other.group_ratio}`,
    });
  if (other.model_ratio != null)
    items.push({
      label: t("模型输入倍率"),
      value: `× ${other.model_ratio}`,
    });
  if (other.completion_ratio != null)
    items.push({
      label: t("模型输出倍率"),
      value: `× ${other.completion_ratio}`,
    });
  if (other.reasoning_effort)
    items.push({
      label: "Reasoning Effort",
      value: other.reasoning_effort,
    });
  if (other.billing_source === "subscription") {
    if (other.subscription_plan_title)
      items.push({
        label: t("订阅套餐"),
        value: other.subscription_plan_title,
      });
    if (other.subscription_consumed != null)
      items.push({
        label: t("订阅抵扣"),
        value: renderQuotaFn(other.subscription_consumed),
      });
    if (other.subscription_remain != null)
      items.push({
        label: t("订阅剩余"),
        value: renderQuotaFn(other.subscription_remain),
      });
  }
  return items;
}

export default function UsageLogs() {
  const { t, i18n } = useTranslation();
  const localeTag =
    i18n.language === "en"
      ? "en-US"
      : i18n.language === "zh-TW"
        ? "zh-TW"
        : "zh-CN";

  const [stat, setStat] = useState(null);
  const [statLoading, setStatLoading] = useState(false);

  const [filters, setFilters] = useState({
    startTime: todayStart(),
    endTime: nowPlusOneHour(),
    tokenName: "",
    modelName: "",
    logType: 0,
  });

  const [logs, setLogs] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [listLoading, setListLoading] = useState(false);

  const [expandedRow, setExpandedRow] = useState(null);

  const fetchStat = useCallback(async (f) => {
    setStatLoading(true);
    try {
      const params = new URLSearchParams();
      if (f.logType) params.set("type", f.logType);
      if (f.tokenName) params.set("token_name", f.tokenName);
      if (f.modelName) params.set("model_name", f.modelName);
      if (f.startTime) params.set("start_timestamp", toUnixSec(f.startTime));
      if (f.endTime) params.set("end_timestamp", toUnixSec(f.endTime));
      const data = await api.get(`/api/log/self/stat?${params}`);
      if (data?.success) setStat(data.data);
    } catch {
      void 0;
    } finally {
      setStatLoading(false);
    }
  }, []);

  const fetchLogs = useCallback(async (f, p, ps) => {
    setListLoading(true);
    setExpandedRow(null);
    try {
      const params = new URLSearchParams();
      params.set("p", p);
      params.set("page_size", ps);
      if (f.logType) params.set("type", f.logType);
      if (f.tokenName) params.set("token_name", f.tokenName);
      if (f.modelName) params.set("model_name", f.modelName);
      if (f.startTime) params.set("start_timestamp", toUnixSec(f.startTime));
      if (f.endTime) params.set("end_timestamp", toUnixSec(f.endTime));
      const data = await api.get(`/api/log/self/?${params}`);
      if (data?.success) {
        const items = data.data?.items ?? data.data ?? [];
        setLogs(Array.isArray(items) ? items : []);
        setTotal(data.data?.total ?? 0);
      }
    } catch {
      setLogs([]);
    } finally {
      setListLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStat(filters);
    fetchLogs(filters, 1, pageSize);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSearch = () => {
    setPage(1);
    fetchStat(filters);
    fetchLogs(filters, 1, pageSize);
  };

  const handleReset = () => {
    const defaultFilters = {
      startTime: todayStart(),
      endTime: nowPlusOneHour(),
      tokenName: "",
      modelName: "",
      logType: 0,
    };
    setFilters(defaultFilters);
    setPage(1);
    fetchStat(defaultFilters);
    fetchLogs(defaultFilters, 1, pageSize);
  };

  const handlePageChange = (newPage) => {
    setPage(newPage);
    fetchLogs(filters, newPage, pageSize);
  };

  const handlePageSizeChange = (e) => {
    const ps = Number(e.target.value);
    setPageSize(ps);
    setPage(1);
    fetchLogs(filters, 1, ps);
  };

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  const handleTypeChange = (e) => {
    const newFilters = { ...filters, logType: Number(e.target.value) };
    setFilters(newFilters);
    setPage(1);
    fetchStat(newFilters);
    fetchLogs(newFilters, 1, pageSize);
  };

  return (
    <div>
      <h2 className="text-base font-medium text-ink mb-5">{t("使用日志")}</h2>

      <div className="grid grid-cols-3 gap-3 mb-5">
        <StatCard
          icon={Zap}
          label={t("消耗额度")}
          value={stat ? renderQuota(stat.quota) : "--"}
          loading={statLoading}
          accent="bg-blue-50 text-blue-500"
        />
        <StatCard
          icon={Activity}
          label={t("RPM（每分钟请求）")}
          value={stat ? stat.rpm : "--"}
          loading={statLoading}
          accent="bg-pink-50 text-pink-500"
        />
        <StatCard
          icon={Clock}
          label={t("TPM（每分钟 Token）")}
          value={stat?.tpm != null ? stat.tpm.toLocaleString(localeTag) : "--"}
          loading={statLoading}
          accent="bg-cream-dark text-ink-muted"
        />
      </div>

      <div className="bg-cream-light rounded-xl border border-border p-4 mb-4 space-y-3">
        <div className="flex gap-2 items-center flex-wrap">
          <div className="flex items-center gap-1.5 flex-1 min-w-[200px]">
            <label className="text-xs text-ink-muted shrink-0">
              {t("开始时间")}
            </label>
            <input
              type="datetime-local"
              value={filters.startTime}
              onChange={(e) =>
                setFilters((f) => ({ ...f, startTime: e.target.value }))
              }
              className="flex-1 px-3 py-2 rounded-lg border border-border bg-card text-ink text-xs outline-none focus:border-ink-muted"
            />
          </div>
          <span className="text-ink-muted text-xs">—</span>
          <div className="flex items-center gap-1.5 flex-1 min-w-[200px]">
            <label className="text-xs text-ink-muted shrink-0">
              {t("结束时间")}
            </label>
            <input
              type="datetime-local"
              value={filters.endTime}
              onChange={(e) =>
                setFilters((f) => ({ ...f, endTime: e.target.value }))
              }
              className="flex-1 px-3 py-2 rounded-lg border border-border bg-card text-ink text-xs outline-none focus:border-ink-muted"
            />
          </div>
        </div>

        <div className="flex gap-2 flex-wrap">
          <input
            type="text"
            placeholder={t("令牌名称")}
            value={filters.tokenName}
            onChange={(e) =>
              setFilters((f) => ({ ...f, tokenName: e.target.value }))
            }
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            className="w-36 px-3 py-2 rounded-lg border border-border bg-card text-ink text-xs outline-none focus:border-ink-muted placeholder:text-ink-faint"
          />
          <input
            type="text"
            placeholder={t("模型名称")}
            value={filters.modelName}
            onChange={(e) =>
              setFilters((f) => ({ ...f, modelName: e.target.value }))
            }
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            className="w-36 px-3 py-2 rounded-lg border border-border bg-card text-ink text-xs outline-none focus:border-ink-muted placeholder:text-ink-faint"
          />
          <select
            value={filters.logType}
            onChange={handleTypeChange}
            className="px-3 py-2 rounded-lg border border-border bg-card text-ink text-xs outline-none focus:border-ink-muted cursor-pointer"
          >
            {LOG_TYPE_DEFS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {t(opt.labelKey)}
              </option>
            ))}
          </select>

          <div className="ml-auto flex gap-2">
            <button
              type="button"
              onClick={handleReset}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-border bg-card text-ink-muted text-xs hover:text-ink hover:bg-cream-dark transition-colors cursor-pointer"
            >
              <RotateCcw size={12} />
              {t("重置")}
            </button>
            <button
              type="button"
              onClick={handleSearch}
              disabled={listLoading}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-ink text-cream-light text-xs font-medium border-none cursor-pointer hover:bg-ink-light transition-colors disabled:opacity-50"
            >
              <Search size={12} />
              {t("查询")}
            </button>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-border overflow-hidden">
        {listLoading ? (
          <div className="py-16 text-center text-sm text-ink-muted">
            <div className="inline-block w-5 h-5 border-2 border-ink-faint border-t-ink rounded-full animate-spin mb-3" />
            <p>{t("加载中...")}</p>
          </div>
        ) : logs.length === 0 ? (
          <div className="py-16 text-center">
            <Clock size={28} className="text-ink-faint mx-auto mb-3" />
            <p className="text-sm text-ink-muted">{t("暂无日志记录")}</p>
            <p className="text-xs text-ink-faint mt-1">
              {t("调整筛选条件后重新查询")}
            </p>
          </div>
        ) : (
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-cream-light border-b border-border">
                <th className="px-4 py-3 text-left text-ink-muted font-medium whitespace-nowrap">
                  {t("时间")}
                </th>
                <th className="px-4 py-3 text-left text-ink-muted font-medium whitespace-nowrap">
                  {t("类型")}
                </th>
                <th className="px-4 py-3 text-left text-ink-muted font-medium whitespace-nowrap">
                  {t("模型")}
                </th>
                <th className="px-4 py-3 text-left text-ink-muted font-medium whitespace-nowrap">
                  {t("令牌")}
                </th>
                <th className="px-4 py-3 text-right text-ink-muted font-medium whitespace-nowrap">
                  {t("输入")}
                </th>
                <th className="px-4 py-3 text-right text-ink-muted font-medium whitespace-nowrap">
                  {t("输出")}
                </th>
                <th className="px-4 py-3 text-right text-ink-muted font-medium whitespace-nowrap">
                  {t("花费")}
                </th>
                <th className="px-4 py-3 text-center text-ink-muted font-medium whitespace-nowrap">
                  {t("详情")}
                </th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log, idx) => {
                const key = log.id ?? idx;
                const isExpanded = expandedRow === key;
                const expandItems = isExpanded
                  ? buildExpandItems(log, t, renderQuota)
                  : [];

                return [
                  <tr
                    key={`row-${key}`}
                    onClick={() => setExpandedRow(isExpanded ? null : key)}
                    className="border-b border-border hover:bg-cream-light/60 transition-colors cursor-pointer"
                  >
                    <td className="px-4 py-3 text-ink-muted whitespace-nowrap">
                      {formatTime(log.created_at, localeTag)}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <TypeBadge typeVal={log.type} t={t} />
                    </td>
                    <td className="px-4 py-3">
                      {log.model_name ? (
                        <span
                          className="inline-block max-w-[130px] truncate px-2 py-0.5 rounded-md bg-cream-dark text-ink font-mono"
                          title={log.model_name}
                        >
                          {log.model_name}
                        </span>
                      ) : (
                        <span className="text-ink-faint">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-ink-muted">
                      {log.token_name || (
                        <span className="text-ink-faint">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right text-ink tabular-nums">
                      {log.prompt_tokens > 0 ? (
                        log.prompt_tokens.toLocaleString(localeTag)
                      ) : (
                        <span className="text-ink-faint">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right text-ink tabular-nums">
                      {log.completion_tokens > 0 ? (
                        log.completion_tokens.toLocaleString(localeTag)
                      ) : (
                        <span className="text-ink-faint">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right text-ink tabular-nums whitespace-nowrap">
                      {log.quota > 0 ? (
                        <span className="font-medium">
                          {renderQuota(log.quota)}
                        </span>
                      ) : (
                        <span className="text-ink-faint">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button
                        type="button"
                        className={`inline-flex items-center justify-center w-5 h-5 rounded transition-transform text-ink-muted ${isExpanded ? "rotate-90" : ""}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          setExpandedRow(isExpanded ? null : key);
                        }}
                        aria-label={t("展开详情")}
                      >
                        <ChevronRight size={13} />
                      </button>
                    </td>
                  </tr>,

                  isExpanded && expandItems.length > 0 && (
                    <tr
                      key={`expand-${key}`}
                      className="bg-cream-light/40 border-b border-border"
                    >
                      <td colSpan={8} className="px-6 py-3">
                        <div className="flex flex-wrap gap-x-8 gap-y-1.5">
                          {expandItems.map((item) => (
                            <div
                              key={item.label}
                              className="flex items-center gap-2"
                            >
                              <span className="text-ink-faint">
                                {item.label}：
                              </span>
                              <span className="text-ink font-mono break-all">
                                {item.value}
                              </span>
                            </div>
                          ))}
                        </div>
                        {log.content && (
                          <p className="mt-2 text-ink-muted text-xs leading-relaxed">
                            {log.content}
                          </p>
                        )}
                      </td>
                    </tr>
                  ),
                ];
              })}
            </tbody>
          </table>
        )}
      </div>

      {!listLoading && logs.length > 0 && (
        <div className="flex items-center justify-between mt-4 text-xs text-ink-muted">
          <div className="flex items-center gap-2">
            <span>{t("共 {{total}} 条", { total })}</span>
            <span className="text-ink-faint">·</span>
            <span>{t("每页")}</span>
            <select
              value={pageSize}
              onChange={handlePageSizeChange}
              className="px-2 py-1 rounded-lg border border-border bg-card text-ink text-xs outline-none cursor-pointer"
            >
              {PAGE_SIZES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
            <span>{t("条")}</span>
          </div>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => handlePageChange(page - 1)}
              disabled={page <= 1}
              className="p-1.5 rounded-lg border border-border bg-card hover:bg-cream-dark disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition-colors"
            >
              <ChevronLeft size={13} />
            </button>
            <span className="px-3 py-1 rounded-lg bg-cream-dark text-ink font-medium">
              {page} / {totalPages}
            </span>
            <button
              type="button"
              onClick={() => handlePageChange(page + 1)}
              disabled={page >= totalPages}
              className="p-1.5 rounded-lg border border-border bg-card hover:bg-cream-dark disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition-colors"
            >
              <ChevronRight size={13} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
