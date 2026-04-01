import { API_BASE_URL } from "./config";
import i18n from "../i18n/i18n";
import { useAuthStore } from "../stores/authStore";

/**
 * SSE 流式输出辅助函数
 * 调用 new-api 的 /v1/chat/completions（Bearer token 认证）
 */

function getRelayToken() {
  const token = useAuthStore.getState().apiToken;
  return typeof token === "string" ? token.trim() : "";
}

function extractDeltaText(delta) {
  const content = delta?.content;
  if (!content) return "";
  if (typeof content === "string") return content;
  if (Array.isArray(content)) {
    return content
      .map((item) => {
        if (typeof item === "string") return item;
        return item?.text || item?.content || "";
      })
      .join("");
  }
  if (typeof content === "object") {
    return content.text || content.content || "";
  }
  return "";
}

function extractReasoningText(delta) {
  const candidates = [
    delta?.reasoning_content,
    delta?.reasoningContent,
    delta?.reasoning,
    delta?.thinking,
  ];

  for (const candidate of candidates) {
    if (!candidate) continue;
    if (typeof candidate === "string") return candidate;
    if (Array.isArray(candidate)) {
      const text = candidate
        .map((item) => {
          if (typeof item === "string") return item;
          return item?.text || item?.content || item?.reasoning || "";
        })
        .join("");
      if (text) return text;
      continue;
    }
    if (typeof candidate === "object") {
      const text = candidate.text || candidate.content || "";
      if (text) return text;
    }
  }

  return "";
}

function stripBase64ImagesFromContent(content) {
  if (typeof content !== "string" || !content) {
    return content;
  }

  // 1) 去掉 Markdown 里的内联 base64 图片：![alt](data:image/...;base64,...)
  // 2) 去掉裸 data:image/...;base64,...
  const withoutMarkdownDataImage = content.replace(
    /!\[[^\]]*]\(\s*data:image\/[a-zA-Z0-9.+-]+;base64,[^)]+\)/g,
    "[image omitted]",
  );

  const withoutBareDataImage = withoutMarkdownDataImage.replace(
    /data:image\/[a-zA-Z0-9.+-]+;base64,[A-Za-z0-9+/=\s]+/g,
    "[image omitted]",
  );

  // 收敛替换后可能产生的多余空白，避免上下文出现大片空行
  return withoutBareDataImage
    .replace(/\[image omitted](\s*\[image omitted])+/g, "[image omitted]")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function sanitizeMessagesForRequest(messages = []) {
  return messages.map((m) => ({
    role: m.role,
    content: stripBase64ImagesFromContent(m.content),
  }));
}

/**
 * 发送流式对话请求
 * @param {Object} params
 * @param {Array} params.messages - 消息数组 [{role, content}]
 * @param {string} params.model - 模型ID
 * @param {Object} params.settings - 对话设置 {enableTemperature, temperature, enableTopP, topP, maxTokens, systemPrompt}
 * @param {Function} params.onChunk - 每个文本块的回调 (text) => void
 * @param {Function} params.onReasoningChunk - 思考内容回调 (text) => void
 * @param {Function} params.onDone - 完成回调 (fullText, usage, fullReasoningText) => void
 * @param {Function} params.onError - 错误回调 (error) => void
 * @param {AbortSignal} params.signal - 取消信号
 * @param {string} [params.reasoning_effort] - 推理强度，如 "high"（部分模型支持）
 */
export async function streamChat({
  messages,
  model,
  settings = {},
  reasoning_effort,
  onChunk,
  onReasoningChunk,
  onDone,
  onError,
  signal,
}) {
  const token = getRelayToken();

  // 构建消息数组，如果有 systemPrompt 则插入到最前面
  const apiMessages = [];
  if (settings.systemPrompt) {
    apiMessages.push({
      role: "system",
      content: stripBase64ImagesFromContent(settings.systemPrompt),
    });
  }
  apiMessages.push(...sanitizeMessagesForRequest(messages));

  const body = {
    model,
    messages: apiMessages,
    stream: true,
  };

  if (
    settings.enableTemperature !== false &&
    settings.temperature !== undefined
  )
    body.temperature = settings.temperature;
  if (settings.enableTopP !== false && settings.topP !== undefined)
    body.top_p = settings.topP;
  if (settings.maxTokens !== undefined) body.max_tokens = settings.maxTokens;
  if (reasoning_effort != null && reasoning_effort !== "") {
    body.reasoning_effort = reasoning_effort;
  }

  let fullText = "";
  let fullReasoningText = "";
  let usage = null;

  try {
    const response = await fetch(`${API_BASE_URL}/v1/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(body),
      signal,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMsg =
        errorData?.error?.message ||
        errorData?.message ||
        i18n.t("API 请求失败 ({{status}})", { status: response.status });

      // 余额不足特殊处理
      if (
        response.status === 429 ||
        errorMsg.includes("quota") ||
        errorMsg.includes("余额")
      ) {
        throw new Error("QUOTA_EXCEEDED:" + errorMsg);
      }
      throw new Error(errorMsg);
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });

      // 按行解析 SSE
      const lines = buffer.split("\n");
      buffer = lines.pop() || ""; // 保留最后未完成的行

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || trimmed === ":") continue;

        if (trimmed === "data: [DONE]") {
          onDone?.(fullText, usage, fullReasoningText);
          return;
        }

        if (trimmed.startsWith("data: ")) {
          try {
            const json = JSON.parse(trimmed.slice(6));
            const choice = json.choices?.[0] || {};

            const delta = choice.delta || {};

            const textChunk = extractDeltaText(delta);
            if (textChunk) {
              fullText += textChunk;
              onChunk?.(textChunk);
            }

            const reasoningChunk = extractReasoningText(delta);
            if (reasoningChunk) {
              fullReasoningText += reasoningChunk;
              onReasoningChunk?.(reasoningChunk);
            }

            // 兼容部分后端在非 delta 字段返回最终思考文本
            if (!reasoningChunk) {
              const finalReasoningText = extractReasoningText(
                choice.message || {},
              );
              if (finalReasoningText) {
                fullReasoningText += finalReasoningText;
                onReasoningChunk?.(finalReasoningText);
              }
            }

            // 有些模型在最后一个 chunk 中返回 usage
            if (json.usage) {
              usage = json.usage;
            }
          } catch {
            // JSON 解析失败，忽略这个 chunk
          }
        }
      }
    }

    // 流正常结束但没有收到 [DONE]
    onDone?.(fullText, usage, fullReasoningText);
  } catch (err) {
    if (err.name === "AbortError") {
      // 用户主动取消
      onDone?.(fullText, usage, fullReasoningText);
      return;
    }
    onError?.(err);
  }
}

/**
 * 非流式对话请求（用于自动生成标题等辅助功能）
 */
export async function chatCompletion({ messages, model, maxTokens = 100 }) {
  const token = getRelayToken();
  const sanitizedMessages = sanitizeMessagesForRequest(messages);

  const response = await fetch(`${API_BASE_URL}/v1/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      model,
      messages: sanitizedMessages,
      max_tokens: maxTokens,
      stream: false,
    }),
  });

  if (!response.ok) {
    throw new Error(
      i18n.t("API 请求失败 ({{status}})", { status: response.status }),
    );
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content || "";
}
