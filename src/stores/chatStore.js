import { create } from "zustand";
import { persist } from "zustand/middleware";
import { streamChat, chatCompletion } from "../lib/stream";
import { buildUserScopedStorageKey } from "./persistScope";
import {
  DEFAULT_MODEL,
  DEFAULT_CONVERSATION_SETTINGS,
  MAX_CONVERSATIONS,
  DEFAULT_CHAT_TITLE_I18N_KEY,
} from "../lib/config";
import i18n from "../i18n/i18n";

const generateId = () =>
  `conv_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
const CHAT_STORAGE_BASE_KEY = "chat-storage";

export const useChatStore = create(
  persist(
    (set, get) => ({
      conversations: [],
      activeConversationId: null,
      isStreaming: false,
      streamingContent: "", // 当前流式传输中的内容
      streamingReasoningContent: "", // 当前流式传输中的思考内容
      abortController: null,

      // 按用户切换持久化命名空间，避免不同账号读取同一份缓存
      switchPersistUser: (userId) => {
        const scopedKey = buildUserScopedStorageKey(
          CHAT_STORAGE_BASE_KEY,
          userId,
        );
        useChatStore.persist.setOptions({
          name: scopedKey,
        });
        const hasScopedState =
          typeof window !== "undefined" &&
          window.localStorage.getItem(scopedKey) !== null;

        if (hasScopedState) {
          useChatStore.persist.rehydrate();
          return;
        }

        useChatStore.setState({
          conversations: [],
          activeConversationId: null,
          isStreaming: false,
          streamingContent: "",
          streamingReasoningContent: "",
          abortController: null,
        });
      },

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
          title: DEFAULT_CHAT_TITLE_I18N_KEY,
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

      // 发送消息；sendOptions 可含 reasoning_effort 等透传 API 的字段
      sendMessage: async (text, sendOptions = {}) => {
        const state = get();
        let { activeConversationId } = state;

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
          reasoning_effort: sendOptions?.reasoning_effort,
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
            if (
              conv &&
              conv.messages.length === 2 &&
              conv.title === DEFAULT_CHAT_TITLE_I18N_KEY
            ) {
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
                content: i18n.t(
                  "请用5-10个中文字概括这段对话的主题，只输出标题，不要标点符号",
                ),
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

      // 清空对话消息
      clearConversationMessages: (id) => {
        set((state) => ({
          conversations: state.conversations.map((c) =>
            c.id === id ? { ...c, messages: [] } : c,
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

      // 从指定助手消息起截断并重新生成该条回复（其后消息一并丢弃）
      regenerateAssistantMessage: async (assistantMessageId) => {
        const conv = get().getActiveConversation();
        if (!conv) return;

        const idx = conv.messages.findIndex(
          (m) =>
            m.id === assistantMessageId && m.role === "assistant" && !m.error,
        );
        if (idx < 0) return;

        const messages = conv.messages.slice(0, idx);
        if (messages.length === 0) return;

        set((state) => ({
          conversations: state.conversations.map((c) =>
            c.id === conv.id ? { ...c, messages, updatedAt: Date.now() } : c,
          ),
        }));

        const abortController = new AbortController();
        set({
          isStreaming: true,
          streamingContent: "",
          streamingReasoningContent: "",
          abortController,
        });

        const fresh = get().conversations.find((c) => c.id === conv.id);
        if (!fresh) {
          set({
            isStreaming: false,
            streamingContent: "",
            streamingReasoningContent: "",
            abortController: null,
          });
          return;
        }

        await streamChat({
          messages,
          model: fresh.model,
          settings: fresh.settings,
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
              model: fresh.model,
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
          onError: () => {
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
      name: buildUserScopedStorageKey(CHAT_STORAGE_BASE_KEY, null),
      partialize: (state) => ({
        conversations: state.conversations,
        activeConversationId: state.activeConversationId,
      }),
    },
  ),
);
