import { create } from "zustand";
import { persist } from "zustand/middleware";
import { apiRequest } from "../lib/api";
import { buildUserScopedStorageKey } from "./persistScope";
import { stringToColor,getModelCategories } from "../helpers";
import i18n from "../i18n/i18n";

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

// 获取模型标签
const getModelCustomTags = (model) => {
  const tags = [];

  if (model?.tags) {
    const customTags = model.tags.split(",").filter((tag) => tag.trim());
    customTags.forEach((tag) => {
      const tagText = tag.trim();
      tags.push({ text: tagText, color: stringToColor(tagText) });
    });
  }

  return tags;
};

const makeProviderMap = (vendors = []) =>
  vendors.reduce((acc, vendor) => {
    if (vendor?.id != null && vendor?.name) {
      acc[vendor.id] = vendor.name;
    }
    return acc;
  }, {});

const transformApiModel = (model, providerMap, modelCategories) => {
  const id = model.model_name || model.id || "";
  const customTags = getModelCustomTags(model);
  let icon = null;

  if (modelCategories && typeof modelCategories === "object") {
    const modelName = model.model_name || id;
    for (const [key, category] of Object.entries(modelCategories)) {
      if (key === "all") continue;
      if (!category?.icon || typeof category?.filter !== "function")
        continue;
      if (category.filter({ model_name: modelName })) {
        icon = category.icon;
        break;
      }
    }
  }

  return {
    ...model,
    id,
    model_name: id,
    name: id,
    icon,
    provider: providerMap[model.vendor_id] || "其他",
    badge: "",
    description: model.description || "",
    customTags,
  };
};

export const useModelStore = create(
  persist(
    (set, get) => ({
      allModels: [],
      groupRatio: {},
      usableGroup: {},
      endpointMap: {},
      autoGroups: [],
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
      const modelCategories = getModelCategories(i18n.t);
          const groupRatio =
            data?.group_ratio && typeof data.group_ratio === "object"
              ? data.group_ratio
              : {};
          const usableGroup =
            data?.usable_group && typeof data.usable_group === "object"
              ? data.usable_group
              : {};
          const endpointMap =
            data?.supported_endpoint &&
            typeof data.supported_endpoint === "object"
              ? data.supported_endpoint
              : {};
          const autoGroups = Array.isArray(data?.auto_groups)
            ? data.auto_groups
            : [];
          const apiModels = modelList
            .map((model) =>
              transformApiModel(model, providerMap, modelCategories),
            )
            .filter((model) => model.id);
          if (apiModels.length > 0) {
            set({
              allModels: apiModels,
              groupRatio,
              usableGroup,
              endpointMap,
              autoGroups,
            });
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
