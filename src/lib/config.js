// new-api 后端地址配置
// 开发环境通过 vite proxy 转发，生产环境直接配置后端地址
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "";

// 默认模型
export const DEFAULT_MODEL = "anthropic/claude-opus-4.6";

// 对话设置默认值
export const DEFAULT_CONVERSATION_SETTINGS = {
  systemPrompt: "",
  enableTemperature: false,
  temperature: 1,
  enableTopP: false,
  topP: 1,
  maxTokens: 4096,
};

// 每次对话最大消息数（localStorage 限制）
export const MAX_MESSAGES_PER_CONVERSATION = 200;

// 每个用户最大对话数
export const MAX_CONVERSATIONS = 100;

/** 持久化中表示「未命名对话」的 i18n 键（展示时用 t()） */
export const DEFAULT_CHAT_TITLE_I18N_KEY = "新对话";
