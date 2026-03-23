import { useState, useEffect, useCallback, useMemo } from "react";
import { Search, RefreshCw, X, Copy, ExternalLink } from "lucide-react";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { useAuthStore } from "../../stores/authStore";
import { api } from "../../lib/api";
import toast from "react-hot-toast";

// ────────────────────────────────────────────────────────────
// 工具函数
// ────────────────────────────────────────────────────────────
function formatQuota(v, digits = 2) {
  if (v == null) return "--";
  return `$${(v / 500000).toFixed(digits)}`;
}

function formatNum(v) {
  if (v == null) return "--";
  return Number(v).toLocaleString("zh-CN");
}

function toDatetimeLocal(date) {
  const pad = (n) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function toUnixSec(datetimeLocal) {
  if (!datetimeLocal) return undefined;
  return Math.floor(new Date(datetimeLocal).getTime() / 1000);
}

function defaultStart() {
  return toDatetimeLocal(new Date(Date.now() - 24 * 3600 * 1000));
}

function defaultEnd() {
  return toDatetimeLocal(new Date(Date.now() + 3600 * 1000));
}

function getGreeting() {
  const h = new Date().getHours();
  if (h < 6) return "凌晨好";
  if (h < 12) return "早上好";
  if (h < 14) return "中午好";
  if (h < 18) return "下午好";
  return "晚上好";
}

// 由模型名哈希生成固定颜色
const MODEL_PALETTE = [
  "#6366f1",
  "#10b981",
  "#f59e0b",
  "#ef4444",
  "#8b5cf6",
  "#06b6d4",
  "#ec4899",
  "#14b8a6",
  "#f97316",
  "#84cc16",
  "#64748b",
  "#a855f7",
  "#0ea5e9",
  "#d946ef",
  "#22c55e",
];

function modelColor(name, index) {
  if (index !== undefined) return MODEL_PALETTE[index % MODEL_PALETTE.length];
  let hash = 0;
  for (let i = 0; i < name.length; i++)
    hash = (hash * 31 + name.charCodeAt(i)) | 0;
  return MODEL_PALETTE[Math.abs(hash) % MODEL_PALETTE.length];
}

// 时间粒度聚合：将小时级数据合并为天/周桶
function aggregateByGrain(rawData, grain, startTs, endTs) {
  const GRAIN_SEC = { hour: 3600, day: 86400, week: 604800 };
  const step = GRAIN_SEC[grain] || 3600;

  // 生成时间桶
  const buckets = {};
  let t = Math.floor(startTs / step) * step;
  while (t <= endTs) {
    buckets[t] = {};
    t += step;
  }

  rawData.forEach((item) => {
    const bucket = Math.floor(item.created_at / step) * step;
    if (!buckets[bucket]) buckets[bucket] = {};
    const model = item.model_name || "其他";
    if (!buckets[bucket][model])
      buckets[bucket][model] = { quota: 0, count: 0, token_used: 0 };
    buckets[bucket][model].quota += item.quota || 0;
    buckets[bucket][model].count += item.count || 0;
    buckets[bucket][model].token_used += item.token_used || 0;
  });

  return buckets;
}

function formatBucketLabel(ts, grain) {
  const d = new Date(ts * 1000);
  if (grain === "hour")
    return `${d.getMonth() + 1}/${d.getDate()} ${String(d.getHours()).padStart(2, "0")}:00`;
  if (grain === "week") return `${d.getMonth() + 1}/${d.getDate()}`;
  return `${d.getMonth() + 1}/${d.getDate()}`;
}

// ────────────────────────────────────────────────────────────
// 骨架卡片
// ────────────────────────────────────────────────────────────
function SkeletonCard() {
  return (
    <div className="bg-card rounded-xl border border-border p-4 animate-pulse">
      <div className="h-3 w-20 bg-cream-dark rounded mb-3" />
      <div className="h-6 w-28 bg-cream-dark rounded mb-2" />
      <div className="h-3 w-16 bg-cream-dark rounded" />
    </div>
  );
}

// ────────────────────────────────────────────────────────────
// 统计卡片
// ────────────────────────────────────────────────────────────
function StatCard({ label, value, sub, accent }) {
  return (
    <div className={`rounded-xl border border-border p-4 ${accent}`}>
      <p className="text-xs text-ink-muted mb-1">{label}</p>
      <p className="text-xl font-semibold text-ink leading-tight">{value}</p>
      {sub && <p className="text-xs text-ink-faint mt-1">{sub}</p>}
    </div>
  );
}

// ────────────────────────────────────────────────────────────
// SearchModal 弹窗
// ────────────────────────────────────────────────────────────
function SearchModal({ params, onConfirm, onClose }) {
  const [local, setLocal] = useState({ ...params });

  useEffect(() => {
    const handler = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  const handleConfirm = () => {
    const startSec = toUnixSec(local.startTime);
    const endSec = toUnixSec(local.endTime);
    if (endSec - startSec > 2592000) {
      toast.error("查询时间跨度不能超过 1 个月");
      return;
    }
    onConfirm(local);
  };

  return (
    <div
      className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-card rounded-xl border border-border w-full max-w-sm p-5 relative">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-ink-muted hover:text-ink cursor-pointer"
        >
          <X size={16} />
        </button>
        <p className="text-sm font-medium text-ink mb-4">搜索条件</p>

        <div className="space-y-3">
          <div>
            <label className="block text-xs text-ink-muted mb-1">
              起始时间
            </label>
            <input
              type="datetime-local"
              value={local.startTime}
              onChange={(e) =>
                setLocal((l) => ({ ...l, startTime: e.target.value }))
              }
              className="w-full px-3 py-2 rounded-lg border border-border bg-cream-light text-ink text-xs outline-none focus:border-ink-muted"
            />
          </div>
          <div>
            <label className="block text-xs text-ink-muted mb-1">
              结束时间
            </label>
            <input
              type="datetime-local"
              value={local.endTime}
              onChange={(e) =>
                setLocal((l) => ({ ...l, endTime: e.target.value }))
              }
              className="w-full px-3 py-2 rounded-lg border border-border bg-cream-light text-ink text-xs outline-none focus:border-ink-muted"
            />
          </div>
          <div>
            <label className="block text-xs text-ink-muted mb-1">
              时间粒度
            </label>
            <select
              value={local.grain}
              onChange={(e) =>
                setLocal((l) => ({ ...l, grain: e.target.value }))
              }
              className="w-full px-3 py-2 rounded-lg border border-border bg-cream-light text-ink text-xs outline-none cursor-pointer"
            >
              <option value="hour">按小时</option>
              <option value="day">按天</option>
              <option value="week">按周</option>
            </select>
          </div>
        </div>

        <div className="flex justify-end gap-2 mt-5">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg border border-border bg-cream-light text-ink text-xs cursor-pointer hover:bg-cream-dark transition-colors"
          >
            取消
          </button>
          <button
            onClick={handleConfirm}
            className="px-4 py-2 rounded-lg bg-ink text-cream-light text-xs font-medium border-none cursor-pointer hover:bg-ink-light transition-colors"
          >
            确定
          </button>
        </div>
      </div>
    </div>
  );
}

// ────────────────────────────────────────────────────────────
// API 信息面板
// ────────────────────────────────────────────────────────────
function ApiInfoPanel({ apiInfoList }) {
  const handleCopy = async (url) => {
    try {
      await navigator.clipboard.writeText(url);
      toast.success("链接已复制");
    } catch {
      /* noop */
    }
  };

  if (!apiInfoList || apiInfoList.length === 0) return null;

  return (
    <div
      className="bg-card rounded-xl border border-border p-4 overflow-y-auto"
      style={{ maxHeight: 480 }}
    >
      <p className="text-xs font-medium text-ink mb-3">API 信息</p>
      <div className="space-y-3">
        {apiInfoList.map((item) => (
          <div
            key={item.id}
            className="flex items-start gap-3 pb-3 border-b border-border last:border-0 last:pb-0"
          >
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-[10px] font-bold shrink-0"
              style={{ backgroundColor: item.color || "#6366f1" }}
            >
              {(item.route || "").slice(0, 2) || "v1"}
            </div>
            <div className="flex-1 min-w-0">
              <button
                onClick={() => handleCopy(item.url)}
                className="text-xs text-ink font-mono truncate block w-full text-left hover:text-ink-muted transition-colors cursor-pointer"
                title={item.url}
              >
                {item.url}
              </button>
              {item.description && (
                <p className="text-xs text-ink-muted mt-0.5 truncate">
                  {item.description}
                </p>
              )}
              <div className="flex gap-2 mt-1.5">
                <a
                  href={item.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-[11px] text-ink-muted hover:text-ink no-underline transition-colors"
                >
                  <ExternalLink size={10} />
                  测速
                </a>
                <a
                  href={item.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-[11px] text-ink-muted hover:text-ink no-underline transition-colors"
                >
                  <ExternalLink size={10} />
                  跳转
                </a>
                <button
                  onClick={() => handleCopy(item.url)}
                  className="flex items-center gap-1 text-[11px] text-ink-muted hover:text-ink cursor-pointer transition-colors"
                >
                  <Copy size={10} />
                  复制
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ────────────────────────────────────────────────────────────
// 自定义 Tooltip（图表悬浮提示）
// ────────────────────────────────────────────────────────────
function ChartTooltip({ active, payload, label, mode }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-card border border-border rounded-xl px-3 py-2 shadow-sm text-xs">
      <p className="text-ink-muted mb-1">{label}</p>
      {payload.map((p) => (
        <div key={p.dataKey} className="flex items-center gap-2">
          <span
            className="w-2 h-2 rounded-full shrink-0"
            style={{ backgroundColor: p.color }}
          />
          <span className="text-ink-muted">{p.name}：</span>
          <span className="text-ink font-medium">
            {mode === "quota" ? formatQuota(p.value, 4) : formatNum(p.value)}
          </span>
        </div>
      ))}
    </div>
  );
}

// ────────────────────────────────────────────────────────────
// 图表区
// ────────────────────────────────────────────────────────────
function ChartsPanel({ rawData, params }) {
  const [activeTab, setActiveTab] = useState(0);

  const TABS = ["消耗分布", "消耗趋势", "调用次数分布", "调用次数排行"];

  // 聚合处理
  const { buckets, models, timeLabels, timeKeys } = useMemo(() => {
    if (!rawData.length)
      return { buckets: {}, models: [], timeLabels: [], timeKeys: [] };
    const startSec = toUnixSec(params.startTime);
    const endSec = toUnixSec(params.endTime);
    const b = aggregateByGrain(rawData, params.grain, startSec, endSec);

    const modelSet = new Set();
    rawData.forEach((d) => modelSet.add(d.model_name || "其他"));
    const models = [...modelSet];

    const timeKeys = Object.keys(b)
      .map(Number)
      .sort((a, b) => a - b);
    const timeLabels = timeKeys.map((k) => formatBucketLabel(k, params.grain));

    return { buckets: b, models, timeLabels, timeKeys };
  }, [rawData, params]);

  // Tab 1/2 数据（柱/线）
  const timeSeriesData = useMemo(() => {
    return timeKeys.map((k, i) => {
      const row = { time: timeLabels[i] };
      models.forEach((m) => {
        row[m] = buckets[k]?.[m] ?? {};
      });
      return row;
    });
  }, [timeKeys, timeLabels, models, buckets]);

  // Tab 3 数据（饼图）
  const pieData = useMemo(() => {
    const totals = {};
    rawData.forEach((d) => {
      const m = d.model_name || "其他";
      totals[m] = (totals[m] || 0) + (d.count || 0);
    });
    return Object.entries(totals).map(([name, value]) => ({ name, value }));
  }, [rawData]);

  // Tab 4 数据（排行柱状图）
  const rankData = useMemo(() => {
    return [...pieData].sort((a, b) => b.value - a.value);
  }, [pieData]);

  const noData = rawData.length === 0;

  const renderEmpty = () => (
    <div className="flex items-center justify-center h-64 text-sm text-ink-muted">
      <p>暂无数据，请调整时间范围后重新查询</p>
    </div>
  );

  return (
    <div className="bg-card rounded-xl border border-border p-4">
      {/* Tab 切换 */}
      <div className="flex gap-1 mb-4 p-1 bg-cream-light rounded-lg w-fit">
        {TABS.map((t, i) => (
          <button
            key={t}
            onClick={() => setActiveTab(i)}
            className={`px-3 py-1.5 rounded-md text-xs font-medium cursor-pointer transition-colors ${
              activeTab === i
                ? "bg-card text-ink shadow-sm"
                : "text-ink-muted hover:text-ink"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Tab 0: 消耗分布 — 堆积柱状图 */}
      {activeTab === 0 &&
        (noData ? (
          renderEmpty()
        ) : (
          <ResponsiveContainer width="100%" height={280}>
            <BarChart
              data={timeSeriesData}
              margin={{ top: 4, right: 8, left: 0, bottom: 0 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="#E8E4DE"
                vertical={false}
              />
              <XAxis
                dataKey="time"
                tick={{ fontSize: 10, fill: "#9A9188" }}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                tick={{ fontSize: 10, fill: "#9A9188" }}
                tickLine={false}
                axisLine={false}
                tickFormatter={(v) => `$${(v / 500000).toFixed(3)}`}
                width={64}
              />
              <Tooltip content={<ChartTooltip mode="quota" />} />
              <Legend iconSize={8} wrapperStyle={{ fontSize: 11 }} />
              {models.map((m, i) => (
                <Bar
                  key={m}
                  dataKey={(row) => row[m]?.quota || 0}
                  name={m}
                  stackId="a"
                  fill={modelColor(m, i)}
                  radius={i === models.length - 1 ? [3, 3, 0, 0] : [0, 0, 0, 0]}
                />
              ))}
            </BarChart>
          </ResponsiveContainer>
        ))}

      {/* Tab 1: 消耗趋势 — 折线图 */}
      {activeTab === 1 &&
        (noData ? (
          renderEmpty()
        ) : (
          <ResponsiveContainer width="100%" height={280}>
            <LineChart
              data={timeSeriesData}
              margin={{ top: 4, right: 8, left: 0, bottom: 0 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="#E8E4DE"
                vertical={false}
              />
              <XAxis
                dataKey="time"
                tick={{ fontSize: 10, fill: "#9A9188" }}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                tick={{ fontSize: 10, fill: "#9A9188" }}
                tickLine={false}
                axisLine={false}
                tickFormatter={(v) => `$${(v / 500000).toFixed(3)}`}
                width={64}
              />
              <Tooltip content={<ChartTooltip mode="quota" />} />
              <Legend iconSize={8} wrapperStyle={{ fontSize: 11 }} />
              {models.map((m, i) => (
                <Line
                  key={m}
                  type="monotone"
                  dataKey={(row) => row[m]?.quota || 0}
                  name={m}
                  stroke={modelColor(m, i)}
                  dot={false}
                  strokeWidth={1.5}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        ))}

      {/* Tab 2: 调用次数分布 — 环形饼图 */}
      {activeTab === 2 &&
        (noData || pieData.length === 0 ? (
          renderEmpty()
        ) : (
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie
                data={pieData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                innerRadius={70}
                outerRadius={110}
                paddingAngle={2}
                label={({ name, percent }) =>
                  `${name} ${(percent * 100).toFixed(1)}%`
                }
                labelLine={{ stroke: "#9A9188", strokeWidth: 1 }}
              >
                {pieData.map((entry, i) => (
                  <Cell key={entry.name} fill={modelColor(entry.name, i)} />
                ))}
              </Pie>
              <Tooltip formatter={(v) => [formatNum(v), "调用次数"]} />
              <Legend iconSize={8} wrapperStyle={{ fontSize: 11 }} />
            </PieChart>
          </ResponsiveContainer>
        ))}

      {/* Tab 3: 调用次数排行 — 横向条形图 */}
      {activeTab === 3 &&
        (noData || rankData.length === 0 ? (
          renderEmpty()
        ) : (
          <ResponsiveContainer
            width="100%"
            height={Math.max(200, rankData.length * 36)}
          >
            <BarChart
              data={rankData}
              layout="vertical"
              margin={{ top: 4, right: 8, left: 0, bottom: 0 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="#E8E4DE"
                horizontal={false}
              />
              <XAxis
                type="number"
                tick={{ fontSize: 10, fill: "#9A9188" }}
                tickLine={false}
                axisLine={false}
                tickFormatter={(v) => formatNum(v)}
              />
              <YAxis
                type="category"
                dataKey="name"
                tick={{ fontSize: 10, fill: "#9A9188" }}
                tickLine={false}
                axisLine={false}
                width={90}
              />
              <Tooltip formatter={(v) => [formatNum(v), "调用次数"]} />
              <Bar dataKey="value" name="调用次数" radius={[0, 3, 3, 0]}>
                {rankData.map((entry, i) => (
                  <Cell key={entry.name} fill={modelColor(entry.name, i)} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        ))}
    </div>
  );
}

// ────────────────────────────────────────────────────────────
// 主组件
// ────────────────────────────────────────────────────────────
export default function UsageStats() {
  const { user } = useAuthStore();

  // 搜索参数
  const [params, setParams] = useState(() => {
    const saved = localStorage.getItem("data_export_default_time") || "hour";
    return {
      startTime: defaultStart(),
      endTime: defaultEnd(),
      grain: saved,
    };
  });

  // 图表原始数据
  const [rawData, setRawData] = useState([]);
  const [loading, setLoading] = useState(false);

  // 系统状态（API 信息）
  const [apiInfoEnabled, setApiInfoEnabled] = useState(false);
  const [apiInfoList, setApiInfoList] = useState([]);

  // 弹窗
  const [showSearch, setShowSearch] = useState(false);

  // ── 拉取图表数据 ──────────────────────────────────────────
  const fetchChartData = useCallback(async (p) => {
    setLoading(true);
    try {
      const qs = new URLSearchParams({
        start_timestamp: toUnixSec(p.startTime),
        end_timestamp: toUnixSec(p.endTime),
      });
      const data = await api.get(`/api/data/self/?${qs}`);
      if (data?.success) {
        setRawData(Array.isArray(data.data) ? data.data : []);
      }
    } catch {
      setRawData([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // ── 拉取系统状态 ──────────────────────────────────────────
  const fetchStatus = useCallback(async () => {
    try {
      const data = await api.get("/api/status");
      setApiInfoEnabled(
        !!(data?.data?.api_info_enabled || data?.api_info_enabled),
      );
      const list = data?.data?.api_info || data?.api_info || [];
      setApiInfoList(Array.isArray(list) ? list : []);
    } catch {
      /* noop */
    }
  }, []);

  useEffect(() => {
    fetchStatus();
    fetchChartData(params);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── 刷新 ──────────────────────────────────────────────────
  const handleRefresh = () => fetchChartData(params);

  // ── 搜索弹窗确认 ──────────────────────────────────────────
  const handleSearchConfirm = (newParams) => {
    localStorage.setItem("data_export_default_time", newParams.grain);
    setParams(newParams);
    setShowSearch(false);
    fetchChartData(newParams);
  };

  // ── 聚合统计数字 ──────────────────────────────────────────
  const { totalQuota, totalCount, totalTokens, avgRpm, avgTpm } =
    useMemo(() => {
      let totalQuota = 0,
        totalCount = 0,
        totalTokens = 0;
      rawData.forEach((d) => {
        totalQuota += d.quota || 0;
        totalCount += d.count || 0;
        totalTokens += d.token_used || 0;
      });

      const startSec = toUnixSec(params.startTime);
      const endSec = toUnixSec(params.endTime);
      const minuteSpan = Math.max(1, (endSec - startSec) / 60);
      const avgRpm = (totalCount / minuteSpan).toFixed(3);
      const avgTpm = (totalTokens / minuteSpan).toFixed(3);

      return { totalQuota, totalCount, totalTokens, avgRpm, avgTpm };
    }, [rawData, params]);

  return (
    <div>
      {/* ── 页面头部 ── */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <p className="text-xs text-ink-muted">{getGreeting()}，</p>
          <h2 className="text-base font-medium text-ink">
            {user?.display_name || user?.username || "用户"}
          </h2>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowSearch(true)}
            title="搜索条件"
            className="w-8 h-8 rounded-full bg-green-500 hover:bg-green-600 text-white flex items-center justify-center cursor-pointer transition-colors border-none"
          >
            <Search size={14} />
          </button>
          <button
            onClick={handleRefresh}
            disabled={loading}
            title="刷新"
            className="w-8 h-8 rounded-full bg-blue-500 hover:bg-blue-600 text-white flex items-center justify-center cursor-pointer transition-colors border-none disabled:opacity-60"
          >
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
          </button>
        </div>
      </div>

      {/* ── 4 组统计卡片 ── */}
      {loading ? (
        <div className="grid grid-cols-2 gap-3 mb-5">
          {Array.from({ length: 8 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 mb-5">
          {/* 账户数据 */}
          <StatCard
            label="当前余额"
            value={formatQuota(user?.quota)}
            sub="账户数据"
            accent="bg-blue-50/60"
          />
          <StatCard
            label="历史消耗"
            value={formatQuota(user?.used_quota)}
            sub="账户数据"
            accent="bg-blue-50/60"
          />
          {/* 使用统计 */}
          <StatCard
            label="历史请求次数"
            value={formatNum(user?.request_count)}
            sub="使用统计"
            accent="bg-green-50/60"
          />
          <StatCard
            label="时间范围调用次数"
            value={formatNum(totalCount)}
            sub="使用统计"
            accent="bg-green-50/60"
          />
          {/* 资源消耗 */}
          <StatCard
            label="时间范围统计额度"
            value={formatQuota(totalQuota, 4)}
            sub="资源消耗"
            accent="bg-amber-50/60"
          />
          <StatCard
            label="时间范围统计 Tokens"
            value={formatNum(totalTokens)}
            sub="资源消耗"
            accent="bg-amber-50/60"
          />
          {/* 性能指标 */}
          <StatCard
            label="平均 RPM"
            value={avgRpm}
            sub="性能指标（当前时间范围）"
            accent="bg-indigo-50/60"
          />
          <StatCard
            label="平均 TPM"
            value={avgTpm}
            sub="性能指标（当前时间范围）"
            accent="bg-indigo-50/60"
          />
        </div>
      )}

      {/* ── 图表区 + API 信息面板 ── */}
      <div
        className={`flex gap-4 ${apiInfoEnabled && apiInfoList.length > 0 ? "items-start" : ""}`}
      >
        <div
          className={
            apiInfoEnabled && apiInfoList.length > 0
              ? "flex-1 min-w-0"
              : "w-full"
          }
        >
          {loading ? (
            <div className="bg-card rounded-xl border border-border p-4 flex items-center justify-center h-64">
              <div className="flex flex-col items-center gap-2 text-ink-muted">
                <div className="w-5 h-5 border-2 border-ink-faint border-t-ink rounded-full animate-spin" />
                <p className="text-xs">图表加载中...</p>
              </div>
            </div>
          ) : (
            <ChartsPanel rawData={rawData} params={params} />
          )}
        </div>

        {apiInfoEnabled && apiInfoList.length > 0 && (
          <div className="w-52 shrink-0">
            <ApiInfoPanel apiInfoList={apiInfoList} />
          </div>
        )}
      </div>

      {/* ── 弹窗 ── */}
      {showSearch && (
        <SearchModal
          params={params}
          onConfirm={handleSearchConfirm}
          onClose={() => setShowSearch(false)}
        />
      )}
    </div>
  );
}
