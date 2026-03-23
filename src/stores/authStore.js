import { create } from "zustand";
import { persist } from "zustand/middleware";
import { api } from "../lib/api";
import { useChatStore } from "./chatStore";
import { useModelStore } from "./modelStore";
import { useSettingsStore } from "./settingsStore";

const switchStoresToUserScope = (userId) => {
  useChatStore.getState().switchPersistUser?.(userId);
  useModelStore.getState().switchPersistUser?.(userId);
  useSettingsStore.getState().switchPersistUser?.(userId);
};

export const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      sessionToken: "",
      apiToken: "", // 用户的 relay API token
      isAuthenticated: false,
      isLoading: false,

      login: async (username, password) => {
        set({ isLoading: true });
        try {
          // New-API 登录成功后通过 session cookie 建立认证，data.data 是用户基本信息对象
          // 先将 data.data 中的 id 存入 store，确保 fetchSelf() 发请求时 New-Api-User header 不为空
          const data = await api.post("/api/user/login", {
            username,
            password,
          });
          const basicUser = data.data || {};
          switchStoresToUserScope(basicUser?.id);
          set({ user: basicUser, isAuthenticated: true, isLoading: false });
          // 登录后获取完整用户信息（user.id 已存入 store，New-Api-User header 可正常携带）
          await get().fetchSelf();
          return { success: true };
        } catch (err) {
          set({ isLoading: false });
          return { success: false, error: err.message };
        }
      },

      /**
       * 邮箱验证码注册（与 new-api 一致：username + email + password + password2 + verification_code）
       */
      register: async ({
        username,
        password,
        password2,
        email,
        verification_code,
        aff_code,
      }) => {
        set({ isLoading: true });
        try {
          await api.post("/api/user/register", {
            username,
            password,
            password2,
            email,
            verification_code,
            ...(aff_code ? { aff_code } : {}),
          });
          set({ isLoading: false });
          return await get().login(username, password);
        } catch (err) {
          set({ isLoading: false });
          return { success: false, error: err.message };
        }
      },

      fetchSelf: async () => {
        try {
          const data = await api.get("/api/user/self");
          const user = data.data || data;
          switchStoresToUserScope(user?.id);
          set({ user, isAuthenticated: true });

          // 如果还没有 API token，尝试获取或创建一个
          if (!get().apiToken) {
            await get().ensureApiToken();
          }
        } catch {
          switchStoresToUserScope(null);
          set({ user: null, isAuthenticated: false, sessionToken: "" });
        }
      },

      ensureApiToken: async () => {
        try {
          // GET /api/token/ 返回分页对象：{ data: { items: [...], total: N } }
          // items[n].key 是脱敏值，需要通过 POST /api/token/:id/key 获取完整 key
          const data = await api.get("/api/token/?p=1&size=10");
          const items = data.data?.items || [];
          let tokenId = null;

          const validToken = items.find((t) => t.status === 1);
          if (validToken?.id) {
            tokenId = validToken.id;
          } else {
            // 没有可用 token，先创建一个
            // POST /api/token/ 成功只返回 { success: true }，不含 key
            await api.post("/api/token/", {
              name: "元枢AI-Default",
              remain_quota: 0,
              unlimited_quota: true,
            });
            // 创建后重新拉取列表找到新 token 的 id
            const freshData = await api.get("/api/token/?p=1&size=10");
            const freshItems = freshData.data?.items || [];
            const newToken = freshItems.find((t) => t.status === 1);
            tokenId = newToken?.id || null;
          }

          if (tokenId) {
            // POST /api/token/:id/key 返回完整、未脱敏的 key
            const keyResult = await api.post(`/api/token/${tokenId}/key`);
            const fullKey = keyResult.data?.key;
            if (fullKey) {
              set({ apiToken: fullKey });
            }
          }
        } catch {
          // Token 获取失败不阻塞使用
        }
      },

      updateProfile: async (updates) => {
        try {
          await api.put("/api/user/self", updates);
          await get().fetchSelf();
          return { success: true };
        } catch (err) {
          return { success: false, error: err.message };
        }
      },

      logout: () => {
        switchStoresToUserScope(null);
        set({
          user: null,
          sessionToken: "",
          apiToken: "",
          isAuthenticated: false,
        });
        window.location.hash = "#/login";
      },
    }),
    {
      name: "auth-storage",
      partialize: (state) => ({
        user: state.user,
        sessionToken: state.sessionToken,
        apiToken: state.apiToken,
        isAuthenticated: state.isAuthenticated,
      }),
    },
  ),
);
