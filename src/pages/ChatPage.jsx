import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  PanelLeftOpen,
  Download,
  Bell,
  User,
  LogOut,
  Menu,
} from "lucide-react";
import Sidebar from "../components/chat/Sidebar";
import ChatArea from "../components/chat/ChatArea";
import InputArea from "../components/chat/InputArea";
import EmptyState from "../components/chat/EmptyState";
import ConversationSettingsModal from "../components/chat/ConversationSettingsModal";
import SubscriptionModal from "../components/subscription/SubscriptionModal";
import { useChatStore } from "../stores/chatStore";
import { useModelStore } from "../stores/modelStore";
import { useAuthStore } from "../stores/authStore";
import { useStatusStore } from "../stores/statusStore";
import { exportAsMarkdown } from "../lib/export";
import { displayConversationTitle } from "../helpers/conversationTitle";
import { DEFAULT_CHAT_TITLE_I18N_KEY } from "../lib/config";

const NOTICE_READ_KEYS_STORAGE = "notice_read_keys";

function getKeyForItem(item) {
  return `${item?.publishDate || ""}-${(item?.content || "").slice(0, 30)}`;
}

function getAnnouncementsFromStatus(s) {
  const list = s?.announcements;
  if (Array.isArray(list)) return list;

  // 兼容：后端字段可能被命名为其他形态
  const alt =
    s?.notice?.announcements ||
    s?.system_notice?.announcements ||
    s?.systemAnnouncements;
  return Array.isArray(alt) ? alt : [];
}

export default function ChatPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [showSubscription, setShowSubscription] = useState(false);

  const {
    isStreaming,
    streamingContent,
    streamingReasoningContent,
    getActiveConversation,
    sendMessage,
    cancelStream,
  } = useChatStore();

  const { fetchModels } = useModelStore();
  const { user, logout } = useAuthStore();
  const status = useStatusStore((s) => s.status);

  const unreadNoticeHasUnread = (() => {
    if (typeof window === "undefined") return false;
    const announcements = getAnnouncementsFromStatus(status);

    if (announcements.length === 0) return false;

    const raw = window.localStorage.getItem(NOTICE_READ_KEYS_STORAGE);
    let readKeys = [];
    try {
      readKeys = raw ? JSON.parse(raw) : [];
    } catch {
      readKeys = [];
    }
    const readSet = new Set(Array.isArray(readKeys) ? readKeys : []);

    return announcements.some((it) => !readSet.has(getKeyForItem(it)));
  })();

  const activeConversation = getActiveConversation();
  const messages = activeConversation?.messages || [];
  const showEmpty = !activeConversation || messages.length === 0;

  // 初始化：刷新模型列表 & 确保有 API token
  useEffect(() => {
    fetchModels();
  }, [fetchModels]);

  useEffect(() => {
    if (typeof window === "undefined") return undefined;

    const updateLayout = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile((prevMobile) => {
        if (prevMobile !== mobile) {
          setSidebarCollapsed(mobile);
        }
        return mobile;
      });
    };

    updateLayout();
    window.addEventListener("resize", updateLayout);
    return () => window.removeEventListener("resize", updateLayout);
  }, []);

  const handleSend = (text, options) => {
    sendMessage(text, options);
  };

  const handleExport = () => {
    exportAsMarkdown(activeConversation);
  };

  const markNoticesAsReadAndNavigate = () => {
    if (typeof window === "undefined") return;
    const announcements = getAnnouncementsFromStatus(status);

    const raw = window.localStorage.getItem(NOTICE_READ_KEYS_STORAGE);
    let readKeys = [];
    try {
      readKeys = raw ? JSON.parse(raw) : [];
    } catch {
      readKeys = [];
    }
    const readSet = new Set(Array.isArray(readKeys) ? readKeys : []);
    announcements.forEach((it) => readSet.add(getKeyForItem(it)));
    window.localStorage.setItem(
      NOTICE_READ_KEYS_STORAGE,
      JSON.stringify(Array.from(readSet)),
    );

    navigate("/account/notifications");
  };

  return (
    <div className="flex h-dvh min-h-0 bg-cream overflow-hidden">
      {isMobile && !sidebarCollapsed && (
        <button
          aria-label={t("关闭侧边栏")}
          className="fixed inset-0 z-30 bg-black/35 border-none p-0 cursor-pointer"
          onClick={() => setSidebarCollapsed(true)}
        />
      )}
      <div
        className={`${
          isMobile
            ? "fixed inset-y-0 left-0 z-40 transition-transform duration-300"
            : "relative"
        } ${isMobile && sidebarCollapsed ? "-translate-x-full" : "translate-x-0"}`}
      >
        <Sidebar
          collapsed={isMobile ? false : sidebarCollapsed}
          onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
          onOpenSubscription={() => setShowSubscription(true)}
        />
      </div>
      <div className="flex-1 flex flex-col min-w-0">
        <div className="flex items-center justify-between px-3 sm:px-5 py-3 border-b border-border bg-cream-light/80 backdrop-blur-sm">
          <div className="flex items-center gap-3">
            {(sidebarCollapsed || isMobile) && (
              <button
                onClick={() => setSidebarCollapsed(false)}
                className="p-1.5 hover:bg-cream-dark rounded-lg text-ink-muted hover:text-ink bg-transparent border-none cursor-pointer transition-colors"
              >
                {isMobile ? <Menu size={17} /> : <PanelLeftOpen size={16} />}
              </button>
            )}
            <h1 className="text-[12px] sm:text-[13px] font-medium text-ink truncate max-w-[56vw] sm:max-w-none">
              {displayConversationTitle(
                activeConversation?.title || DEFAULT_CHAT_TITLE_I18N_KEY,
              )}
            </h1>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={handleExport}
              disabled={showEmpty}
              className="flex items-center gap-1 px-2.5 py-1 text-[11px] text-ink-muted hover:text-ink hover:bg-cream-dark rounded-md bg-transparent border-none cursor-pointer transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <Download size={12} />
              <span className="hidden sm:inline">{t("导出")}</span>
            </button>

            <div className="w-px h-4 bg-border mx-1" />

            {/* 通知图标 */}
            <button
              className="relative p-1.5 text-ink-muted hover:text-ink hover:bg-cream-dark rounded-md bg-transparent border-none cursor-pointer transition-colors"
              title={t("通知中心")}
              onClick={markNoticesAsReadAndNavigate}
            >
              <Bell size={14} />
              {unreadNoticeHasUnread && (
                <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-red-500" />
              )}
            </button>

            {/* 用户头像下拉 */}
            <div className="relative ml-1">
              <button
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="w-7 h-7 rounded-full bg-ink text-cream-light flex items-center justify-center text-[11px] font-medium cursor-pointer border-none"
              >
                {(user?.display_name || user?.username || "U")[0].toUpperCase()}
              </button>
              {userMenuOpen && (
                <>
                  <div
                    className="fixed inset-0 z-10"
                    onClick={() => setUserMenuOpen(false)}
                  />
                  <div className="absolute right-0 top-full mt-2 w-40 bg-white border border-border rounded-xl shadow-lg z-20 py-1">
                    <Link
                      to="/account"
                      onClick={() => setUserMenuOpen(false)}
                      className="flex items-center gap-2 px-4 py-2 text-[12px] text-ink hover:bg-cream no-underline transition-colors"
                    >
                      <User size={13} />
                      {t("账号管理")}
                    </Link>
                    <div className="h-px bg-border mx-2 my-1" />
                    <button
                      onClick={() => {
                        logout();
                        setUserMenuOpen(false);
                      }}
                      className="w-full flex items-center gap-2 px-4 py-2 text-[12px] text-red-600 hover:bg-red-50 bg-transparent border-none cursor-pointer transition-colors"
                    >
                      <LogOut size={13} />
                      {t("退出登录")}
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {showEmpty ? (
          <EmptyState onSend={handleSend} />
        ) : (
          <ChatArea
            messages={messages}
            isStreaming={isStreaming}
            streamingContent={streamingContent}
            streamingReasoningContent={streamingReasoningContent}
            activeModel={activeConversation?.model}
          />
        )}

        <InputArea
          onSend={handleSend}
          isStreaming={isStreaming}
          onCancel={cancelStream}
          onOpenSettings={() => setShowSettings(true)}
          hasConversation={!!activeConversation}
        />
      </div>

      {showSettings && activeConversation && (
        <ConversationSettingsModal
          conversation={activeConversation}
          onClose={() => setShowSettings(false)}
        />
      )}

      {showSubscription && (
        <SubscriptionModal onClose={() => setShowSubscription(false)} />
      )}
    </div>
  );
}
