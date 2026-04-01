import { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Send,
  Square,
  Paperclip,
  Globe,
  Settings,
  Atom,
  KeyRound,
} from "lucide-react";
import ModelSelector from "./ModelSelector";
import ApiKeySettingsModal from "./ApiKeySettingsModal";

export default function InputArea({
  onSend,
  isStreaming,
  onCancel,
  onOpenSettings,
  hasConversation,
}) {
  const { t } = useTranslation();
  const [text, setText] = useState("");
  const [deepThinking, setDeepThinking] = useState(false);
  const [webSearch] = useState(false);
  const [showApiKeySettings, setShowApiKeySettings] = useState(false);

  const toggleToolClass = (active) =>
    `flex items-center gap-1 px-2 py-1.5 rounded-md border-none cursor-pointer transition-colors text-[12px] ${
      active
        ? "bg-cream-dark text-ink font-medium"
        : "text-ink-muted hover:text-ink hover:bg-cream bg-transparent"
    }`;

  const handleSend = () => {
    if (!text.trim() || isStreaming) return;
    const options = {};
    if (deepThinking) options.reasoning_effort = "high";
    if (webSearch) options.web_search = true;
    onSend(text, Object.keys(options).length > 0 ? options : undefined);
    setText("");
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="border-t border-border bg-cream-light p-4">
      <div className="max-w-3xl mx-auto">
        <div className="bg-white rounded-xl border border-border focus-within:border-ink/20 transition-colors">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={t("输入你的问题... (Enter 发送，Shift+Enter 换行)")}
            rows={3}
            disabled={isStreaming}
            className="w-full px-4 pt-3 pb-1 bg-transparent border-none outline-none resize-none text-[13px] text-ink placeholder:text-ink-faint disabled:opacity-50"
          />
          <div className="flex items-center justify-between px-3 pb-2.5">
            <div className="flex items-center gap-0.5">
              {/* <button
                type="button"
                className="p-1.5 text-ink-muted hover:text-ink hover:bg-cream rounded-md bg-transparent border-none cursor-pointer transition-colors"
                title={t("上传附件 (即将支持)")}
              >
                <Paperclip size={14} />
              </button> */}
              <button
                type="button"
                className={toggleToolClass(deepThinking)}
                aria-pressed={deepThinking}
                onClick={() => setDeepThinking((v) => !v)}
                title={t("深度思考")}
              >
                <Atom size={14} />
                <span>{t("深度思考")}</span>
              </button>
              {/* <button
                type="button"
                className={toggleToolClass(webSearch)}
                aria-pressed={webSearch}
                onClick={() => setWebSearch((v) => !v)}
                title={t("联网搜索")}
              >
                <Globe size={14} />
                <span>{t("联网搜索")}</span>
              </button> */}

              {hasConversation && onOpenSettings && (
                <button
                  onClick={onOpenSettings}
                  className="flex items-center gap-1 px-2 py-1.5 text-ink-muted hover:text-ink hover:bg-cream rounded-md bg-transparent border-none cursor-pointer transition-colors text-[12px]"
                  title={t("对话设置")}
                >
                  <Settings size={14} />
                  <span>{t("对话设置")}</span>
                </button>
              )}
            </div>

            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setShowApiKeySettings(true)}
                className="flex items-center gap-1 px-2 py-1.5 text-ink-muted hover:text-ink hover:bg-cream rounded-md bg-transparent border-none cursor-pointer transition-colors text-[12px]"
                title={t("导入 Key")}
              >
                <KeyRound size={14} />
                <span>{t("导入 Key")}</span>
              </button>
              <ModelSelector />
              {isStreaming ? (
                <button
                  onClick={onCancel}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-50 text-red-600 text-[12px] font-medium border border-red-200 cursor-pointer hover:bg-red-100 transition-colors"
                >
                  <Square size={12} />
                  {t("停止")}
                </button>
              ) : (
                <button
                  onClick={handleSend}
                  disabled={!text.trim()}
                  className={`p-2 rounded-lg border-none cursor-pointer transition-all ${
                    text.trim()
                      ? "bg-ink text-white hover:bg-ink-light"
                      : "bg-cream-dark text-ink-faint cursor-not-allowed"
                  }`}
                >
                  <Send size={14} />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {showApiKeySettings && (
        <ApiKeySettingsModal onClose={() => setShowApiKeySettings(false)} />
      )}
    </div>
  );
}
