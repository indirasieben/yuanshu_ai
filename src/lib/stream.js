import { API_BASE_URL } from "./config";

/**
 * SSE 流式输出辅助函数
 * 调用 new-api 的 /v1/chat/completions（Bearer token 认证）
 */

function getRelayToken() {
  try {
    const auth = JSON.parse(localStorage.getItem("auth-storage") || "{}");
    return auth?.state?.apiToken || auth?.state?.sessionToken || "";
  } catch {
    return "";
  }
}

/**
 * 发送流式对话请求
 * @param {Object} params
 * @param {Array} params.messages - 消息数组 [{role, content}]
 * @param {string} params.model - 模型ID
 * @param {Object} params.settings - 对话设置 {temperature, topP, maxTokens, systemPrompt}
 * @param {Function} params.onChunk - 每个文本块的回调 (text) => void
 * @param {Function} params.onReasoningChunk - 思考内容回调 (text) => void
 * @param {Function} params.onDone - 完成回调 (fullText, usage, fullReasoningText) => void
 * @param {Function} params.onError - 错误回调 (error) => void
 * @param {AbortSignal} params.signal - 取消信号
 */
export async function streamChat({
  messages,
  model,
  settings = {},
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
    apiMessages.push({ role: "system", content: settings.systemPrompt });
  }
  apiMessages.push(
    ...messages.map((m) => ({ role: m.role, content: m.content })),
  );

  const body = {
    model,
    messages: apiMessages,
    stream: true,
  };

  if (settings.temperature !== undefined)
    body.temperature = settings.temperature;
  if (settings.topP !== undefined) body.top_p = settings.topP;
  if (settings.maxTokens !== undefined) body.max_tokens = settings.maxTokens;

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
        `API 请求失败 (${response.status})`;

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
            const delta = json.choices?.[0]?.delta;

            const textChunk = delta?.content;
            if (textChunk) {
              fullText += textChunk;
              onChunk?.(textChunk);
            }

            const reasoningChunk = delta?.reasoning_content;
            if (reasoningChunk) {
              fullReasoningText += reasoningChunk;
              onReasoningChunk?.(reasoningChunk);
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

  const response = await fetch(`${API_BASE_URL}/v1/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      model,
      messages,
      max_tokens: maxTokens,
      stream: false,
    }),
  });

  if (!response.ok) {
    throw new Error(`API 请求失败 (${response.status})`);
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content || "";
}
