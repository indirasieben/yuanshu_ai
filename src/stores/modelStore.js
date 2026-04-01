import { create } from "zustand";
import { persist } from "zustand/middleware";
import { apiRequest } from "../lib/api";
import { buildUserScopedStorageKey } from "./persistScope";

// 默认常用模型（PRD MOD-002）
const DEFAULT_FAVORITES = [
  "anthropic/claude-opus-4.6",
  "anthropic/claude-sonnet-4.6",
  "openai/gpt-5.4",
  "google/gemini-3.1-pro-preview",
  "google/gemini-3-pro-image-preview",
  "deepseek/deepseek-R1",
  "moonshotai/kimi-k2.5",
  "minimax/minimax-m2.7",
];
const MODEL_STORAGE_BASE_KEY = "model-storage";

const parseCapabilitiesFromTags = (tags) => {
  if (!tags || typeof tags !== "string") return [];
  return tags
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean)
    .filter((item) => !/^\d+(\.\d+)?\s*[KMG]$/i.test(item));
};

const parseContextWindowFromTags = (tags) => {
  if (!tags || typeof tags !== "string") return "";
  const items = tags
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
  const context = items.find((item) => /^\d+(\.\d+)?\s*[KMG]$/i.test(item));
  return context || "";
};

const makeProviderMap = (vendors = []) =>
  vendors.reduce((acc, vendor) => {
    if (vendor?.id != null && vendor?.name) {
      acc[vendor.id] = vendor.name;
    }
    return acc;
  }, {});

const transformApiModel = (model, providerMap) => {
  const id = model.model_name || model.id || "";
  const capabilities = parseCapabilitiesFromTags(model.tags);
  const contextWindow = parseContextWindowFromTags(model.tags);

  return {
    ...model,
    id,
    model_name: id,
    name: id,
    provider: providerMap[model.vendor_id] || "其他",
    badge: "",
    multimodal:
      capabilities.includes("Vision") || capabilities.includes("Audio"),
    description: model.description || "",
    capabilities,
    contextWindow,
  };
};

export const useModelStore = create(
  persist(
    (set, get) => ({
      allModels: [],
      chatFavorites: DEFAULT_FAVORITES,
      isLoading: false,

      switchPersistUser: (userId) => {
        const scopedKey = buildUserScopedStorageKey(
          MODEL_STORAGE_BASE_KEY,
          userId,
        );
        useModelStore.persist.setOptions({
          name: scopedKey,
        });
        const hasScopedState =
          typeof window !== "undefined" &&
          window.localStorage.getItem(scopedKey) !== null;

        if (hasScopedState) {
          useModelStore.persist.rehydrate();
          return;
        }

        useModelStore.setState({
          chatFavorites: [...DEFAULT_FAVORITES],
        });
      },

      // 获取常用模型的完整信息
      getFavoriteModels: () => {
        const { allModels, chatFavorites } = get();
        return chatFavorites
          .map((id) => allModels.find((m) => m.id === id))
          .filter(Boolean);
      },

      // 获取模型详情
      getModel: (id) => {
        return (
          get().allModels.find((m) => m.id === id) || {
            id,
            name: id,
            provider: "未知",
            badge: "",
          }
        );
      },

      // 从 API 刷新模型列表
      fetchModels: async () => {
        set({ isLoading: true });
        try {
          // const data = await apiRequest("/api/user/models");
          const data = await apiRequest("/api/pricing");
          const modelList = Array.isArray(data?.data) ? data.data : [];
          const providerMap = makeProviderMap(data?.vendors);
          const apiModels = modelList
            .map((model) => transformApiModel(model, providerMap))
            .filter((model) => model.id);
          if (apiModels.length > 0) {
            set({ allModels: apiModels });
          }
        } catch {
          // 使用本地默认数据
        } finally {
          set({ isLoading: false });
        }
      },

      // 添加到常用模型
      addFavorite: (modelId) => {
        set((state) => {
          if (state.chatFavorites.includes(modelId)) return state;
          return { chatFavorites: [...state.chatFavorites, modelId] };
        });
      },

      // 从常用模型移除
      removeFavorite: (modelId) => {
        set((state) => ({
          chatFavorites: state.chatFavorites.filter((id) => id !== modelId),
        }));
      },
    }),
    {
      name: buildUserScopedStorageKey(MODEL_STORAGE_BASE_KEY, null),
      partialize: (state) => ({
        chatFavorites: state.chatFavorites,
      }),
    },
  ),
);
