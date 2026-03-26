import { create } from "zustand";
import { api } from "../lib/api";
import { setStatusData } from "../helpers/data";

const STATUS_CACHE_KEY = "status";
const STATUS_FETCHED_AT_KEY = "status_fetched_at";

const safeParseJson = (v) => {
  try {
    return JSON.parse(v);
  } catch {
    return null;
  }
};

// 用于防止 StrictMode 下重复触发多次请求
let inFlight = null;
let didRequestStatusThisSession = false;

export const useStatusStore = create((set, get) => ({
  status: null,
  fetchedAt: null,
  isFetching: false,
  lastError: null,

  hydrateFromCache: () => {
    if (typeof window === "undefined") return;

    const raw = window.localStorage.getItem(STATUS_CACHE_KEY);
    if (!raw) return;

    const cached = safeParseJson(raw);
    if (!cached) return;

    const fetchedAtRaw = window.localStorage.getItem(
      STATUS_FETCHED_AT_KEY,
    );
    const fetchedAt = fetchedAtRaw ? Number(fetchedAtRaw) : null;

    // 兼容旧逻辑：很多地方仍直接从 localStorage 读取派生字段
    setStatusData(cached);

    set({ status: cached, fetchedAt, lastError: null });
  },

  fetchStatus: async ({ force = false } = {}) => {
    const { isFetching } = get();

    if (isFetching && inFlight) return inFlight;

    // “站点打开首次请求”语义：本次会话内只发起一次 /api/status
    // 但在 force=true 时允许再次刷新（例如切到 /account/settings 更新数据）
    if (!force && didRequestStatusThisSession) {
      return get().status;
    }

    didRequestStatusThisSession = true;

    inFlight = (async () => {
      set({ isFetching: true, lastError: null });

      try {
        const res = await api.get("/api/status");
        const payload = res?.data ?? res;

        // 兼容：把后端配置写入本地缓存字段
        setStatusData(payload);
        window.localStorage.setItem(
          STATUS_CACHE_KEY,
          JSON.stringify(payload),
        );
        window.localStorage.setItem(
          STATUS_FETCHED_AT_KEY,
          String(Date.now()),
        );

        set({ status: payload, fetchedAt: Date.now(), isFetching: false });
        return payload;
      } catch (err) {
        set({
          lastError: err?.message || String(err),
          isFetching: false,
        });

        // 失败时不清空缓存，让页面仍可展示本地字段
        return get().status;
      } finally {
        inFlight = null;
      }
    })();

    return inFlight;
  },
}));

