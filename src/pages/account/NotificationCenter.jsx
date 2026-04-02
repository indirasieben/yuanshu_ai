import React, { useEffect, useState, useMemo } from "react";
import {
  Button,
  Modal,
  Empty,
  Tabs,
  TabPane,
  Timeline,
} from "@douyinfe/semi-ui";
import { useTranslation } from "react-i18next";
import { getRelativeTime } from "../../helpers";
import { marked } from "marked";
import {
  IllustrationNoContent,
  IllustrationNoContentDark,
} from "@douyinfe/semi-illustrations";
import { Bell, Megaphone, Loader2 } from "lucide-react";

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

function getKeyForItem(item) {
  return `${item?.publishDate || ""}-${(item?.content || "").slice(0, 30)}`;
}

export default function NotificationCenter() {
  const { t } = useTranslation();
  const status = useStatusStore((s) => s.status);
  const fetchStatus = useStatusStore((s) => s.fetchStatus);

  const [activeTab, setActiveTab] = useState("inApp");
  const [loadingNotice, setLoadingNotice] = useState(false);
  const [noticeContent, setNoticeContent] = useState("");
  const [noticeError, setNoticeError] = useState(null);
  const [readKeys, setReadKeys] = useState(() => {
    if (typeof window === "undefined") return [];
    try {
      const raw = window.localStorage.getItem(NOTICE_READ_KEYS_STORAGE);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });

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
        const data = res?.data;
        if (!mounted) return;
        if (data != null && data !== "") {
          setNoticeContent(marked.parse(String(data)));
        } else {
          setNoticeContent("");
        }
      } catch (err) {
        const msg = err?.message || String(err);
        if (mounted) {
          setNoticeError(msg);
          setNoticeContent("");
        }
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

  const announcements = useMemo(() => {
    const list = status?.announcements;
    if (Array.isArray(list)) return list;

    const alt =
      status?.notice?.announcements ||
      status?.system_notice?.announcements ||
      status?.systemAnnouncements;
    return Array.isArray(alt) ? alt : [];
  }, [status]);

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

    setReadKeys((prev) => {
      const readSet = new Set(Array.isArray(prev) ? prev : []);
      list.forEach((it) => readSet.add(getKeyForItem(it)));
      const next = Array.from(readSet);
      window.localStorage.setItem(
        NOTICE_READ_KEYS_STORAGE,
        JSON.stringify(next),
      );
      return next;
    });
  }, [status]);

  const readSet = useMemo(
    () => new Set(Array.isArray(readKeys) ? readKeys : []),
    [readKeys],
  );

  const processedAnnouncements = useMemo(() => {
    return (announcements || []).slice(0, 20).map((item) => {
      const key = getKeyForItem(item);
      const absoluteTime = formatAbsoluteTime(item?.publishDate);

      return {
        key,
        type: item?.type || "default",
        time: absoluteTime,
        content: item?.content || "",
        extra: item?.extra || "",
        relative: getRelativeTime(item.publishDate),
        isUnread: !readSet.has(key),
      };
    });
  }, [announcements, readSet]);

  const renderMarkdownNotice = () => {
    if (loadingNotice) {
      return (
        <div className="py-12 flex flex-col items-center justify-center gap-2">
          <Loader2 className="animate-spin text-ink-muted" size={18} />
          <div className="text-xs text-ink-muted">{t("加载中...")}</div>
        </div>
      );
    }

    if (noticeError || !noticeContent) {
      return (
        <div className="py-12">
          <Empty
            className="text-sm"
            image={
              <IllustrationNoContent style={{ width: 150, height: 150 }} />
            }
            darkModeImage={
              <IllustrationNoContentDark style={{ width: 150, height: 150 }} />
            }
            description={t("暂无公告")}
          />
        </div>
      );
    }

    return (
      <div
        dangerouslySetInnerHTML={{ __html: noticeContent }}
        className="markdown-body notice-content-scroll max-h-[55vh] overflow-y-auto pr-2 text-[13px] leading-relaxed text-ink"
      />
    );
  };

  const renderAnnouncementTimeline = () => {
    if (processedAnnouncements.length === 0) {
      return (
        <div className="py-12">
          <Empty
            className="text-sm"
            image={
              <IllustrationNoContent style={{ width: 150, height: 150 }} />
            }
            darkModeImage={
              <IllustrationNoContentDark style={{ width: 150, height: 150 }} />
            }
            description={t("暂无系统公告")}
          />
        </div>
      );
    }

    return (
      <div className="max-h-[55vh] overflow-y-auto pr-2 card-content-scroll">
        <Timeline mode="left">
          {processedAnnouncements.map((item, idx) => {
            const htmlContent = marked.parse(item.content || "");
            const htmlExtra = item.extra ? marked.parse(item.extra) : "";
            return (
              <Timeline.Item
                key={item.key || idx}
                type={item.type}
                time={`${item.relative ? `${item.relative} ` : ""}${item.time}`}
                extra={
                  item.extra ? (
                    <div
                      className="text-xs text-ink-muted"
                      dangerouslySetInnerHTML={{ __html: htmlExtra }}
                    />
                  ) : null
                }
              >
                <div>
                  <div
                    className={item.isUnread ? "shine-text" : ""}
                    dangerouslySetInnerHTML={{ __html: htmlContent }}
                  />
                </div>
              </Timeline.Item>
            );
          })}
        </Timeline>
      </div>
    );
  };

  const renderBody = () => {
    if (activeTab === "inApp") {
      return renderMarkdownNotice();
    }
    return renderAnnouncementTimeline();
  };

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <h2 className="text-base font-medium text-ink m-0">{t("通知中心")}</h2>
        <Tabs activeKey={activeTab} onChange={setActiveTab} type="button">
          <TabPane
            tab={
              <span className="inline-flex items-center gap-1">
                <Bell size={14} /> {t("通知")}
              </span>
            }
            itemKey="inApp"
          />
          <TabPane
            tab={
              <span className="inline-flex items-center gap-1">
                <Megaphone size={14} /> {t("系统公告")}
              </span>
            }
            itemKey="system"
          />
        </Tabs>
      </div>

      {renderBody()}
    </div>
  );
}
