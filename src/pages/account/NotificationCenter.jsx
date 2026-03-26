import React, { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Bell, Megaphone } from "lucide-react";
import ReactMarkdown from "react-markdown";
import toast from "react-hot-toast";
import { api } from "../../lib/api";
import { useStatusStore } from "../../stores/statusStore";

const NOTICE_READ_KEYS_STORAGE = "notice_read_keys";

function pad2(n) {
  return String(n).padStart(2, "0");
}

function formatAbsoluteTime(publishDate) {
  if (!publishDate) return "";
  const d = new Date(publishDate);
  if (isNaN(d.getTime())) return String(publishDate);
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(
    d.getDate(),
  )} ${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
}

function formatRelativeTime(publishDate, language) {
  if (!publishDate) return "";
  const d = new Date(publishDate);
  if (isNaN(d.getTime())) return "";

  const diffMs = d.getTime() - Date.now(); // future positive
  const absMs = Math.abs(diffMs);

  const seconds = Math.round(absMs / 1000);
  const minutes = Math.round(seconds / 60);
  const hours = Math.round(minutes / 60);
  const days = Math.round(hours / 24);

  const isFuture = diffMs > 0;
  const zh = language !== "en" && language !== "en-US";

  if (seconds < 30) return zh ? "刚刚" : "just now";
  if (minutes < 60) {
    if (zh)
      return `${isFuture ? "在" : ""}${minutes} 分钟${isFuture ? "后" : "前"}`;
    return isFuture ? `in ${minutes} minutes` : `${minutes} minutes ago`;
  }
  if (hours < 24) {
    if (zh)
      return `${isFuture ? "在" : ""}${hours} 小时${isFuture ? "后" : "前"}`;
    return isFuture ? `in ${hours} hours` : `${hours} hours ago`;
  }

  if (zh) return `${isFuture ? "在" : ""}${days} 天${isFuture ? "后" : "前"}`;
  return isFuture ? `in ${days} days` : `${days} days ago`;
}

function getKeyForItem(item) {
  return `${item?.publishDate || ""}-${(item?.content || "").slice(0, 30)}`;
}

export default function NotificationCenter() {
  const { t, i18n } = useTranslation();
  const status = useStatusStore((s) => s.status);
  const fetchStatus = useStatusStore((s) => s.fetchStatus);

  const [activeTab, setActiveTab] = useState("system"); // system | notice
  const [loadingNotice, setLoadingNotice] = useState(false);
  const [noticeContent, setNoticeContent] = useState("");
  const [noticeError, setNoticeError] = useState(null);

  useEffect(() => {
    if (!status) {
      void fetchStatus();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    let mounted = true;

    const displayNotice = async () => {
      setLoadingNotice(true);
      setNoticeError(null);
      try {
        const res = await api.get("/api/notice");
        const payload = res?.data ?? res;
        const content = res?.data === "" ? "" : payload || "";
        if (mounted) setNoticeContent(content);
      } catch (err) {
        const msg = err?.message || String(err);
        if (mounted) setNoticeError(msg);
        toast.error(msg);
      } finally {
        if (mounted) setLoadingNotice(false);
      }
    };

    void displayNotice();
    return () => {
      mounted = false;
    };
  }, []);

  // 进入通知中心视为已读：把当前 announcements 全部写入本地已读列表
  useEffect(() => {
    if (typeof window === "undefined") return;
    const direct = status?.announcements;
    const list = (() => {
      if (Array.isArray(direct)) return direct;
      const alt =
        status?.notice?.announcements ||
        status?.system_notice?.announcements ||
        status?.systemAnnouncements;
      return Array.isArray(alt) ? alt : [];
    })();
    if (!list.length) return;

    const raw = window.localStorage.getItem(NOTICE_READ_KEYS_STORAGE);
    let readKeys = [];
    try {
      readKeys = raw ? JSON.parse(raw) : [];
    } catch {
      readKeys = [];
    }

    const readSet = new Set(Array.isArray(readKeys) ? readKeys : []);
    list.forEach((it) => readSet.add(getKeyForItem(it)));

    window.localStorage.setItem(
      NOTICE_READ_KEYS_STORAGE,
      JSON.stringify(Array.from(readSet)),
    );
  }, [status]);

  const announcements = useMemo(() => {
    const list = status?.announcements;
    if (Array.isArray(list)) return list;

    // 兼容：后端字段可能被命名为其他形态
    const alt =
      status?.notice?.announcements ||
      status?.system_notice?.announcements ||
      status?.systemAnnouncements;
    return Array.isArray(alt) ? alt : [];
  }, [status]);

  const processedAnnouncements = useMemo(() => {
    const unreadKeys = []; // 这里暂未有“未读 key 列表”的上层状态
    const unreadSet = new Set(unreadKeys);

    return (announcements || []).slice(0, 20).map((item) => {
      const relative = formatRelativeTime(item?.publishDate, i18n.language);
      const absoluteTime = formatAbsoluteTime(item?.publishDate);

      return {
        key: getKeyForItem(item),
        type: item?.type || "default",
        time: absoluteTime,
        content: item?.content || "",
        extra: item?.extra || "",
        relative,
        isUnread: unreadSet.has(getKeyForItem(item)),
      };
    });
  }, [announcements, i18n.language]);

  const renderEmpty = (icon, titleText, descText) => (
    <div className="py-12 text-center">
      {icon}
      <p className="text-sm text-ink-muted mt-3">{titleText}</p>
      <p className="text-xs text-ink-faint mt-1">{descText}</p>
    </div>
  );

  return (
    <div>
      <h2 className="text-base font-medium text-ink mb-6">{t("通知中心")}</h2>

      <div className="bg-cream-light rounded-lg p-1 flex gap-1 mb-5 flex-wrap inline-block">
        <button
          type="button"
          onClick={() => setActiveTab("notice")}
          className={`px-4 py-1.5 rounded-md text-xs font-medium cursor-pointer border-none transition-all ${
            activeTab === "notice"
              ? "bg-card text-ink shadow-sm"
              : "text-ink-muted hover:text-ink bg-transparent"
          }`}
        >
          <span className="inline-flex items-center gap-1.5">
            <Bell size={14} /> 公告
          </span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("system")}
          className={`px-4 py-1.5 rounded-md text-xs font-medium cursor-pointer border-none transition-all ${
            activeTab === "system"
              ? "bg-card text-ink shadow-sm"
              : "text-ink-muted hover:text-ink bg-transparent"
          }`}
        >
          <span className="inline-flex items-center gap-1.5">
            <Megaphone size={14} /> 系统公告
          </span>
        </button>
      </div>

      {activeTab === "notice" && (
        <div>
          {loadingNotice ? (
            <div className="py-12 text-center text-sm text-ink-muted">
              加载中...
            </div>
          ) : noticeError ? (
            renderEmpty(
              <Bell size={28} className="text-ink-faint mx-auto" />,
              t("暂无通知"),
              t("系统公告、额度预警等通知将显示在这里"),
            )
          ) : !noticeContent ? (
            renderEmpty(
              <Bell size={28} className="text-ink-faint mx-auto" />,
              t("暂无通知"),
              t("系统公告、额度预警等通知将显示在这里"),
            )
          ) : (
            <div className="markdown-body text-[13px] leading-relaxed text-ink max-h-[55vh] overflow-y-auto pr-2">
              <ReactMarkdown>{noticeContent}</ReactMarkdown>
            </div>
          )}
        </div>
      )}

      {activeTab === "system" && (
        <div>
          {processedAnnouncements.length === 0 ? (
            renderEmpty(
              <Megaphone size={28} className="text-ink-faint mx-auto" />,
              t("暂无通知"),
              t("系统公告、额度预警等通知将显示在这里"),
            )
          ) : (
            <div className="max-h-[55vh] overflow-y-auto pr-2 space-y-6">
              <div className="space-y-4">
                {processedAnnouncements.map((item) => (
                  <div key={item.key} className="flex gap-4">
                    <div className="mt-2 shrink-0">
                      <div className="w-2.5 h-2.5 rounded-full bg-ink-faint" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-baseline justify-between gap-4">
                        <div className="text-xs text-ink-muted">
                          {item.relative ? (
                            <span className="mr-2">{item.relative}</span>
                          ) : null}
                          {item.time}
                        </div>
                      </div>

                      <div className="markdown-body text-[13px] leading-relaxed text-ink mt-2">
                        <ReactMarkdown>{item.content}</ReactMarkdown>
                      </div>

                      {item.extra ? (
                        <div className="mt-2 text-xs text-ink-muted">
                          <div className="markdown-body">
                            <ReactMarkdown>{item.extra}</ReactMarkdown>
                          </div>
                        </div>
                      ) : null}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
