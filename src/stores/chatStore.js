import { create } from "zustand";
import { persist } from "zustand/middleware";
import { streamChat, chatCompletion } from "../lib/stream";
import {
  DEFAULT_MODEL,
  DEFAULT_CONVERSATION_SETTINGS,
  MAX_CONVERSATIONS,
} from "../lib/config";

const generateId = () =>
  `conv_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

export const useChatStore = create(
  persist(
    (set, get) => ({
      conversations: [],
      activeConversationId: null,
      isStreaming: false,
      streamingContent: "", // 当前流式传输中的内容
      streamingReasoningContent: "", // 当前流式传输中的思考内容
      abortController: null,

      // 获取当前对话
      getActiveConversation: () => {
        const { conversations, activeConversationId } = get();
        return conversations.find((c) => c.id === activeConversationId) || null;
      },

      // 创建新对话
      createConversation: (model) => {
        const id = generateId();
        const conversation = {
          id,
          title: "新对话",
          messages: [],
          model: model || DEFAULT_MODEL,
          settings: { ...DEFAULT_CONVERSATION_SETTINGS },
          createdAt: Date.now(),
          updatedAt: Date.now(),
        };

        set((state) => {
          let convs = [conversation, ...state.conversations];
          // 限制对话数量
          if (convs.length > MAX_CONVERSATIONS) {
            convs = convs.slice(0, MAX_CONVERSATIONS);
          }
          return { conversations: convs, activeConversationId: id };
        });

        return id;
      },

      // 设置当前对话
      setActiveConversation: (id) => {
        set({ activeConversationId: id, streamingContent: "" });
      },

      // 发送消息
      sendMessage: async (text) => {
        const state = get();
        let { activeConversationId, conversations } = state;

        // 如果没有活跃对话，创建一个
        if (!activeConversationId) {
          activeConversationId = get().createConversation();
        }

        const conv = get().conversations.find(
          (c) => c.id === activeConversationId,
        );
        if (!conv) return;

        // 添加用户消息
        const userMessage = {
          id: `msg_${Date.now()}`,
          role: "user",
          content: text,
          timestamp: new Date().toISOString(),
        };

        set((state) => ({
          conversations: state.conversations.map((c) =>
            c.id === activeConversationId
              ? {
                  ...c,
                  messages: [...c.messages, userMessage],
                  updatedAt: Date.now(),
                }
              : c,
          ),
        }));

        // 开始流式请求
        const abortController = new AbortController();
        set({
          isStreaming: true,
          streamingContent: "",
          streamingReasoningContent: "",
          abortController,
        });

        const updatedConv = get().conversations.find(
          (c) => c.id === activeConversationId,
        );
        const messagesForApi = updatedConv.messages;

        await streamChat({
          messages: messagesForApi,
          model: updatedConv.model,
          settings: updatedConv.settings,
          signal: abortController.signal,
          onChunk: (text) => {
            set((state) => ({
              streamingContent: state.streamingContent + text,
            }));
          },
          onReasoningChunk: (text) => {
            set((state) => ({
              streamingReasoningContent: state.streamingReasoningContent + text,
            }));
          },
          onDone: (fullText, usage, reasoningContent) => {
            const aiMessage = {
              id: `msg_${Date.now()}`,
              role: "assistant",
              content: fullText,
              reasoningContent: reasoningContent || "",
              timestamp: new Date().toISOString(),
              model: updatedConv.model,
              tokens: usage
                ? {
                    input: usage.prompt_tokens || 0,
                    output: usage.completion_tokens || 0,
                  }
                : null,
            };

            set((state) => ({
              conversations: state.conversations.map((c) =>
                c.id === activeConversationId
                  ? {
                      ...c,
                      messages: [...c.messages, aiMessage],
                      updatedAt: Date.now(),
                    }
                  : c,
              ),
              isStreaming: false,
              streamingContent: "",
              streamingReasoningContent: "",
              abortController: null,
            }));

            // 首次对话自动生成标题
            const conv = get().conversations.find(
              (c) => c.id === activeConversationId,
            );
            if (conv && conv.messages.length === 2 && conv.title === "新对话") {
              get().autoGenerateTitle(activeConversationId);
            }
          },
          onError: (err) => {
            const errorMessage = {
              id: `msg_${Date.now()}`,
              role: "assistant",
              content: "",
              timestamp: new Date().toISOString(),
              model: updatedConv.model,
              error: err.message.startsWith("QUOTA_EXCEEDED:")
                ? { type: "quota", message: err.message.slice(15) }
                : { type: "network", message: err.message },
            };

            set((state) => ({
              conversations: state.conversations.map((c) =>
                c.id === activeConversationId
                  ? {
                      ...c,
                      messages: [...c.messages, errorMessage],
                      updatedAt: Date.now(),
                    }
                  : c,
              ),
              isStreaming: false,
              streamingContent: "",
              streamingReasoningContent: "",
              abortController: null,
            }));
          },
        });
      },

      // 取消流式传输
      cancelStream: () => {
        const { abortController } = get();
        if (abortController) {
          abortController.abort();
        }
      },

      // 自动生成对话标题
      autoGenerateTitle: async (conversationId) => {
        const conv = get().conversations.find((c) => c.id === conversationId);
        if (!conv || conv.messages.length < 2) return;

        try {
          const title = await chatCompletion({
            model: conv.model,
            messages: [
              { role: "user", content: conv.messages[0].content },
              {
                role: "assistant",
                content: conv.messages[1].content.slice(0, 200),
              },
              {
                role: "user",
                content:
                  "请用5-10个中文字概括这段对话的主题，只输出标题，不要标点符号",
              },
            ],
            maxTokens: 30,
          });

          const cleanTitle = title
            .replace(/["""''、。，！？]/g, "")
            .trim()
            .slice(0, 30);
          if (cleanTitle) {
            get().renameConversation(conversationId, cleanTitle);
          }
        } catch {
          // 标题生成失败不影响使用
        }
      },

      // 重命名对话
      renameConversation: (id, title) => {
        set((state) => ({
          conversations: state.conversations.map((c) =>
            c.id === id ? { ...c, title } : c,
          ),
        }));
      },

      // 删除对话
      deleteConversation: (id) => {
        set((state) => {
          const newConvs = state.conversations.filter((c) => c.id !== id);
          const newActive =
            state.activeConversationId === id
              ? newConvs[0]?.id || null
              : state.activeConversationId;
          return { conversations: newConvs, activeConversationId: newActive };
        });
      },

      // 更新对话设置
      updateConversationSettings: (id, settings) => {
        set((state) => ({
          conversations: state.conversations.map((c) =>
            c.id === id
              ? { ...c, settings: { ...c.settings, ...settings } }
              : c,
          ),
        }));
      },

      // 切换对话的模型
      switchModel: (modelId) => {
        const { activeConversationId } = get();
        if (!activeConversationId) return;
        set((state) => ({
          conversations: state.conversations.map((c) =>
            c.id === activeConversationId ? { ...c, model: modelId } : c,
          ),
        }));
      },

      // 重新生成最后一条 AI 回复
      regenerateLastMessage: async () => {
        const conv = get().getActiveConversation();
        if (!conv) return;

        // 找到最后一条 AI 消息并移除
        const messages = [...conv.messages];
        while (
          messages.length > 0 &&
          messages[messages.length - 1].role === "assistant"
        ) {
          messages.pop();
        }

        // 获取最后一条用户消息
        const lastUserMsg = messages[messages.length - 1];
        if (!lastUserMsg || lastUserMsg.role !== "user") return;

        // 更新对话消息（移除旧的 AI 回复）
        set((state) => ({
          conversations: state.conversations.map((c) =>
            c.id === conv.id ? { ...c, messages } : c,
          ),
        }));

        // 重新发送（sendMessage 会自动添加 AI 回复）
        // 但我们需要跳过添加用户消息步骤
        const abortController = new AbortController();
        set({
          isStreaming: true,
          streamingContent: "",
          streamingReasoningContent: "",
          abortController,
        });

        await streamChat({
          messages,
          model: conv.model,
          settings: conv.settings,
          signal: abortController.signal,
          onChunk: (text) => {
            set((state) => ({
              streamingContent: state.streamingContent + text,
            }));
          },
          onReasoningChunk: (text) => {
            set((state) => ({
              streamingReasoningContent: state.streamingReasoningContent + text,
            }));
          },
          onDone: (fullText, usage, reasoningContent) => {
            const aiMessage = {
              id: `msg_${Date.now()}`,
              role: "assistant",
              content: fullText,
              reasoningContent: reasoningContent || "",
              timestamp: new Date().toISOString(),
              model: conv.model,
              tokens: usage
                ? {
                    input: usage.prompt_tokens || 0,
                    output: usage.completion_tokens || 0,
                  }
                : null,
            };
            set((state) => ({
              conversations: state.conversations.map((c) =>
                c.id === conv.id
                  ? {
                      ...c,
                      messages: [...c.messages, aiMessage],
                      updatedAt: Date.now(),
                    }
                  : c,
              ),
              isStreaming: false,
              streamingContent: "",
              streamingReasoningContent: "",
              abortController: null,
            }));
          },
          onError: (err) => {
            set({
              isStreaming: false,
              streamingContent: "",
              streamingReasoningContent: "",
              abortController: null,
            });
          },
        });
      },
    }),
    {
      name: "chat-storage",
      partialize: (state) => ({
        conversations: state.conversations,
        activeConversationId: state.activeConversationId,
      }),
    },
  ),
);
