import { create } from "zustand";
import { persist } from "zustand/middleware";
import { DEFAULT_MODEL } from "../lib/config";
import { MODEL_META } from "../data/modelMeta";
import { apiRequest } from "../lib/api";
import { buildUserScopedStorageKey } from "./persistScope";

// 默认常用模型（PRD MOD-002）
const DEFAULT_FAVORITES = [""];
const MODEL_STORAGE_BASE_KEY = "model-storage";

export const useModelStore = create(
  persist(
    (set, get) => ({
      allModels: Object.entries(MODEL_META).map(([id, meta]) => ({
        id,
        ...meta,
      })),
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
          const data = await apiRequest("/api/user/models");
          // 返回格式: { success: true, data: ["model-id-1", "model-id-2", ...] }
          const modelIds = data.data || [];
          const apiModels = modelIds.map((id) => {
            const meta = MODEL_META[id] || {};
            return {
              id,
              name: meta.name || id,
              provider: meta.provider || "其他",
              badge: meta.badge || "",
              multimodal: meta.multimodal || false,
              description: meta.description || "",
              capabilities: meta.capabilities || [],
              contextWindow: meta.contextWindow || "",
            };
          });
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
