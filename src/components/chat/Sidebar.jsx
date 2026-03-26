import { useState, useRef, useMemo } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  PanelLeftClose,
  Plus,
  CreditCard,
  Layers,
  User,
  Key,
  MoreHorizontal,
  Pencil,
  Trash2,
  Search,
  BrushCleaning,
  X,
} from "lucide-react";
import { useChatStore } from "../../stores/chatStore";
import {
  displayConversationTitle,
  conversationTitleMatchesSearch,
} from "../../helpers/conversationTitle";

export default function Sidebar({ collapsed, onToggle, onOpenSubscription }) {
  const { t, i18n } = useTranslation();
  const [editingId, setEditingId] = useState(null);
  const [editTitle, setEditTitle] = useState("");
  const [menuId, setMenuId] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const editRef = useRef(null);

  const {
    conversations,
    activeConversationId,
    createConversation,
    setActiveConversation,
    renameConversation,
    deleteConversation,
    clearConversationMessages,
  } = useChatStore();

  // 按 updatedAt 降序排列
  const sortedConversations = [...conversations].sort(
    (a, b) => b.updatedAt - a.updatedAt,
  );

  // 搜索过滤
  const filteredConversations = searchQuery
    ? sortedConversations.filter(
        (c) =>
          conversationTitleMatchesSearch(c.title, searchQuery) ||
          c.messages.some((m) =>
            m.content.toLowerCase().includes(searchQuery.toLowerCase()),
          ),
      )
    : sortedConversations;

  const navItems = useMemo(
    () => [
      { icon: Key, labelKey: "API 设置", to: "/api-keys" },
      { icon: Layers, labelKey: "模型列表", to: "/models" },
      { icon: User, labelKey: "账号管理", to: "/account" },
    ],
    [],
  );

  const handleNewChat = () => {
    createConversation();
  };

  const handleStartRename = (conv) => {
    setEditingId(conv.id);
    setEditTitle(conv.title);
    setMenuId(null);
    setTimeout(() => editRef.current?.focus(), 50);
  };

  const handleSaveRename = () => {
    if (editingId && editTitle.trim()) {
      renameConversation(editingId, editTitle.trim());
    }
    setEditingId(null);
    setEditTitle("");
  };

  const handleDelete = (id) => {
    deleteConversation(id);
    setMenuId(null);
  };

  const handleClearConversation = (id) => {
    clearConversationMessages(id);
    setMenuId(null);
  };

  return (
    <aside
      className={`h-screen bg-cream-light border-r border-border flex flex-col transition-all duration-300 ${
        collapsed ? "w-0 overflow-hidden" : "w-60"
      }`}
    >
      <div className="flex items-center justify-between p-4">
        <Link
          to="/"
          className="font-serif text-sm font-bold text-ink italic no-underline hover:text-ink-muted transition-colors"
        >
          {t("元枢 AI")}
        </Link>
        <button
          onClick={onToggle}
          className="p-1.5 hover:bg-cream-dark rounded-lg text-ink-muted hover:text-ink bg-transparent border-none cursor-pointer transition-colors"
        >
          <PanelLeftClose size={16} />
        </button>
      </div>

      {/* 搜索 */}
      <div className="px-3 mb-1">
        <div className="relative">
          <Search
            size={12}
            className="absolute left-2.5 top-1/2 -translate-y-1/2 text-ink-faint"
          />
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t("搜索对话...")}
            className="w-full pl-7 pr-7 py-1.5 rounded-lg bg-cream-dark/50 border-none text-[11px] text-ink placeholder:text-ink-faint outline-none focus:bg-cream-dark transition-colors"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-ink-faint hover:text-ink bg-transparent border-none cursor-pointer p-0"
            >
              <X size={11} />
            </button>
          )}
        </div>
      </div>

      <div className="p-3 pt-2">
        <button
          onClick={handleNewChat}
          className="w-full flex items-center gap-2 px-3 py-2 bg-ink text-white text-[12px] font-medium rounded-lg border-none cursor-pointer hover:bg-ink-light transition-colors"
        >
          <Plus size={14} />
          {t("新建对话")}
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-3 space-y-0.5">
        {filteredConversations.map((conv) => (
          <div key={conv.id} className="relative group">
            {editingId === conv.id ? (
              <div className="px-3 py-2">
                <input
                  ref={editRef}
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  onBlur={handleSaveRename}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleSaveRename();
                    if (e.key === "Escape") {
                      setEditingId(null);
                      setEditTitle("");
                    }
                  }}
                  className="w-full px-2 py-1 rounded text-[12px] text-ink border border-ink/20 outline-none bg-white"
                />
              </div>
            ) : (
              <button
                onClick={() => setActiveConversation(conv.id)}
                className={`w-full text-left px-3 py-2.5 rounded-lg text-[12px] border-none cursor-pointer transition-colors ${
                  activeConversationId === conv.id
                    ? "bg-white text-ink shadow-sm"
                    : "bg-transparent text-ink-muted hover:bg-white/50 hover:text-ink"
                }`}
              >
                <div className="truncate font-medium pr-6">
                  {displayConversationTitle(conv.title)}
                </div>
                <div className="text-[11px] text-ink-faint mt-0.5">
                  {new Date(conv.updatedAt).toLocaleDateString(
                    i18n.language === "en"
                      ? "en-US"
                      : i18n.language === "zh-TW"
                        ? "zh-TW"
                        : "zh-CN",
                    { month: "short", day: "numeric" },
                  )}
                  {" · "}
                  {t("{{n}} 条消息", { n: conv.messages.length })}
                </div>
              </button>
            )}

            {/* 三点菜单 */}
            {editingId !== conv.id && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setMenuId(menuId === conv.id ? null : conv.id);
                }}
                className="absolute right-2 top-2.5 p-1 rounded text-ink-faint hover:text-ink hover:bg-cream-dark bg-transparent border-none cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <MoreHorizontal size={13} />
              </button>
            )}

            {/* 下拉菜单 */}
            {menuId === conv.id && (
              <>
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setMenuId(null)}
                />
                <div className="absolute right-0 top-8 z-20 w-32 bg-white border border-border rounded-lg shadow-lg py-1">
                  <button
                    onClick={() => handleStartRename(conv)}
                    className="w-full flex items-center gap-2 px-3 py-1.5 text-[11px] text-ink hover:bg-cream bg-transparent border-none cursor-pointer transition-colors"
                  >
                    <Pencil size={11} />
                    {t("重命名")}
                  </button>
                  <button
                    onClick={() => handleClearConversation(conv.id)}
                    className="w-full flex items-center gap-2 px-3 py-1.5 text-[11px] text-ink hover:bg-cream bg-transparent border-none cursor-pointer transition-colors"
                  >
                    <BrushCleaning size={11} />
                    {t("清空对话")}
                  </button>
                  <button
                    onClick={() => handleDelete(conv.id)}
                    className="w-full flex items-center gap-2 px-3 py-1.5 text-[11px] text-red-600 hover:bg-red-50 bg-transparent border-none cursor-pointer transition-colors"
                  >
                    <Trash2 size={11} />
                    {t("删除")}
                  </button>
                </div>
              </>
            )}
          </div>
        ))}

        {filteredConversations.length === 0 && (
          <div className="text-center py-6 text-[11px] text-ink-faint">
            {searchQuery
              ? t("未找到匹配的对话")
              : t("暂无对话，点击上方按钮新建")}
          </div>
        )}
      </div>

      <div className="p-3 border-t border-border space-y-0.5">
        <button
          onClick={onOpenSubscription}
          className="w-full flex items-center gap-2 px-3 py-1.5 rounded-lg text-[12px] text-ink-muted hover:bg-white hover:text-ink bg-transparent border-none cursor-pointer transition-colors"
        >
          <CreditCard size={14} />
          {t("ytoken 充值")}
        </button>
        {navItems.map((item) => (
          <Link
            key={item.labelKey}
            to={item.to}
            className="w-full flex items-center gap-2 px-3 py-1.5 rounded-lg text-[12px] text-ink-muted hover:bg-white hover:text-ink no-underline transition-colors"
          >
            <item.icon size={14} />
            {t(item.labelKey)}
          </Link>
        ))}
      </div>
    </aside>
  );
}
