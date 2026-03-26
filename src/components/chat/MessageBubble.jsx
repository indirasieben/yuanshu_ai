import { useState } from "react";
import ReactMarkdown from "react-markdown";
import { useTranslation } from "react-i18next";
import { User, Copy, Check, RefreshCw, ChevronDown } from "lucide-react";
import { useModelStore } from "../../stores/modelStore";
import { useChatStore } from "../../stores/chatStore";

function extractBase64ImageSrc(content) {
  if (typeof content !== "string" || !content.trim()) {
    return null;
  }

  const markdownMatch = content.match(
    /!\[[^\]]*]\((data:image\/[a-zA-Z0-9.+-]+;base64,[A-Za-z0-9+/=\s]+)\)?/s,
  );
  const directMatch = content.match(
    /(data:image\/[a-zA-Z0-9.+-]+;base64,[A-Za-z0-9+/=\s]+)/s,
  );

  const rawSrc = markdownMatch?.[1] || directMatch?.[1];
  if (!rawSrc) {
    return null;
  }

  const commaIndex = rawSrc.indexOf(",");
  if (commaIndex === -1) {
    return null;
  }

  const prefix = rawSrc.slice(0, commaIndex + 1);
  const base64Body = rawSrc.slice(commaIndex + 1).replace(/\s+/g, "");
  if (!base64Body) {
    return null;
  }

  return `${prefix}${base64Body}`;
}

function isStandaloneBase64ImageContent(content) {
  if (typeof content !== "string") {
    return false;
  }

  return /^\s*(?:!\[[^\]]*]\(\s*)?data:image\/[a-zA-Z0-9.+-]+;base64,[A-Za-z0-9+/=\s]+(?:\s*\))?\s*$/s.test(
    content,
  );
}

function ReasoningBlock({ reasoningContent, isStreaming }) {
  const { t } = useTranslation();
  const [expanded, setExpanded] = useState(!!isStreaming);

  return (
    <div className="mb-3 rounded-xl border border-border overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between px-3 py-2 bg-cream-light hover:bg-cream text-[11px] text-ink-muted transition-colors bg-transparent border-none cursor-pointer"
      >
        <span className="flex items-center gap-1.5">
          {t("思考过程")}
          {isStreaming && (
            <span className="inline-block w-1 h-3 bg-ink-muted/60 animate-pulse" />
          )}
        </span>
        <ChevronDown
          size={11}
          className={`transition-transform duration-200 ${expanded ? "rotate-180" : ""}`}
        />
      </button>
      {expanded && (
        <div className="px-3 py-2 text-[12px] text-ink-muted leading-relaxed whitespace-pre-wrap border-t border-border bg-white/50">
          {reasoningContent}
        </div>
      )}
    </div>
  );
}

export default function MessageBubble({ message }) {
  const { t, i18n } = useTranslation();
  const isUser = message.role === "user";
  const [copied, setCopied] = useState(false);
  const { getModel } = useModelStore();
  const { regenerateAssistantMessage, isStreaming } = useChatStore();

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(message.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard unavailable */
    }
  };

  const handleRegenerate = () => {
    if (!isStreaming) {
      regenerateAssistantMessage(message.id);
    }
  };

  const modelInfo = message.model ? getModel(message.model) : null;
  const locale =
    i18n.language === "en"
      ? "en-US"
      : i18n.language === "zh-TW"
        ? "zh-TW"
        : "zh-CN";
  const timestamp = message.timestamp
    ? new Date(message.timestamp).toLocaleTimeString(locale, {
        hour: "2-digit",
        minute: "2-digit",
      })
    : "";
  const base64ImageSrc = !isUser ? extractBase64ImageSrc(message.content) : null;
  const renderImageOnly =
    !!base64ImageSrc && isStandaloneBase64ImageContent(message.content);

  // 错误消息
  if (message.error) {
    return (
      <div className="flex gap-3 justify-start">
        <div className="w-7 h-7 rounded-full border border-red-200 flex items-center justify-center shrink-0 mt-1 bg-red-50">
          <svg width="14" height="14" viewBox="0 0 18 18" fill="none">
            <path
              d="M5 9L9 5L13 9L9 13Z"
              stroke="#DC2626"
              strokeWidth="1.2"
              fill="none"
              opacity="0.4"
            />
            <circle cx="9" cy="9" r="1.5" fill="#DC2626" opacity="0.6" />
          </svg>
        </div>
        <div className="max-w-[75%]">
          <div className="rounded-2xl px-4 py-3 bg-red-50 border border-red-200 rounded-bl-sm">
            <p className="text-[13px] text-red-700">
              {message.error.type === "quota"
                ? t("额度不足，请充值后继续使用")
                : t("请求失败：{{message}}", {
                    message: message.error.message,
                  })}
            </p>
          </div>
          <div className="mt-1.5 px-1">
            <span className="text-[11px] text-ink-faint">{timestamp}</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex gap-3 ${isUser ? "justify-end" : "justify-start"}`}>
      {!isUser && (
        <div className="w-7 h-7 rounded-full border border-border flex items-center justify-center shrink-0 mt-1 bg-white">
          <svg width="14" height="14" viewBox="0 0 18 18" fill="none">
            <path
              d="M5 9L9 5L13 9L9 13Z"
              stroke="#1A1A1A"
              strokeWidth="1.2"
              fill="none"
              opacity="0.4"
            />
            <circle cx="9" cy="9" r="1.5" fill="#1A1A1A" opacity="0.6" />
          </svg>
        </div>
      )}

      <div className={`max-w-[75%] ${isUser ? "order-first" : ""}`}>
        <div
          className={`rounded-2xl px-4 py-3 ${
            isUser
              ? "bg-ink text-white rounded-br-sm"
              : "bg-white border border-border rounded-bl-sm"
          }`}
        >
          {isUser ? (
            <p className="text-[13px] leading-relaxed whitespace-pre-wrap">
              {message.content}
            </p>
          ) : (
            <div className="markdown-body text-[13px] leading-relaxed text-ink">
              {message.reasoningContent && (
                <ReasoningBlock
                  reasoningContent={message.reasoningContent}
                  isStreaming={message.isStreaming}
                />
              )}
              {base64ImageSrc && (
                <img
                  src={base64ImageSrc}
                  alt="generated image"
                  className="max-w-full h-auto rounded-lg border border-border mb-2"
                />
              )}
              {!renderImageOnly && (
                <ReactMarkdown>{message.content}</ReactMarkdown>
              )}
              {message.isStreaming &&
                !message.content &&
                !message.reasoningContent && (
                  <span className="inline-block w-1.5 h-4 bg-ink/60 ml-0.5 animate-pulse" />
                )}
              {message.isStreaming && message.content && (
                <span className="inline-block w-1.5 h-4 bg-ink/60 ml-0.5 animate-pulse" />
              )}
            </div>
          )}
        </div>

        {!isUser && !message.isStreaming && (
          <div className="flex items-center gap-3 mt-1.5 px-1">
            <span className="text-[11px] text-ink-faint">
              {modelInfo?.name || message.model}
              {message.tokens && (
                <>
                  {" "}
                  · {message.tokens.input} / {message.tokens.output} tokens
                </>
              )}
              {timestamp && <> · {timestamp}</>}
            </span>
            <div className="flex items-center gap-0.5">
              <button
                onClick={handleCopy}
                className="p-1 text-ink-faint/50 hover:text-ink-muted bg-transparent border-none cursor-pointer transition-colors"
                title={t("复制")}
              >
                {copied ? (
                  <Check size={11} className="text-green-600" />
                ) : (
                  <Copy size={11} />
                )}
              </button>
              <button
                onClick={handleRegenerate}
                disabled={isStreaming}
                className="p-1 text-ink-faint/50 hover:text-ink-muted bg-transparent border-none cursor-pointer transition-colors disabled:opacity-30"
                title={t("重新生成")}
              >
                <RefreshCw size={11} />
              </button>
            </div>
          </div>
        )}

        {isUser && (
          <div className="text-right mt-1 px-1">
            <span className="text-[11px] text-ink-faint">{timestamp}</span>
          </div>
        )}
      </div>

      {isUser && (
        <div className="w-7 h-7 bg-ink rounded-full flex items-center justify-center shrink-0 mt-1">
          <User size={13} className="text-white" />
        </div>
      )}
    </div>
  );
}
