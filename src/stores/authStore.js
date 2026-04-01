import { create } from "zustand";
import { persist } from "zustand/middleware";
import { api } from "../lib/api";
import { applyUserLanguageFromProfile } from "../i18n/syncLanguage";
import { useChatStore } from "./chatStore";
import { useModelStore } from "./modelStore";
import { useSettingsStore } from "./settingsStore";

const DEFAULT_TOKEN_ID_STORAGE_PREFIX = "default_api_token_id:user:";

function getDefaultTokenIdStorageKey(userId) {
  return `${DEFAULT_TOKEN_ID_STORAGE_PREFIX}${userId}`;
}

function getDefaultApiTokenIdForUser(userId) {
  if (userId == null) return null;
  try {
    const raw = localStorage.getItem(getDefaultTokenIdStorageKey(userId));
    if (!raw) return null;
    const id = Number(raw);
    if (!Number.isFinite(id) || id <= 0) return null;
    return id;
  } catch {
    return null;
  }
}

function setDefaultApiTokenIdForUser(userId, tokenId) {
  if (userId == null || tokenId == null) return;
  localStorage.setItem(getDefaultTokenIdStorageKey(userId), String(tokenId));
}

function clearDefaultApiTokenIdForUser(userId) {
  if (userId == null) return;
  localStorage.removeItem(getDefaultTokenIdStorageKey(userId));
}

function getUserIdFromPersistedAuth() {
  try {
    const raw = localStorage.getItem("auth-storage");
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed?.state?.user?.id ?? null;
  } catch {
    return null;
  }
}

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
      isAuthenticated: false,
      isLoading: false,

      resolveCurrentUserId: () => {
        const userId = get().user?.id;
        if (userId != null) return userId;
        return getUserIdFromPersistedAuth();
      },

      getDefaultApiTokenId: (userId = null) => {
        const resolvedUserId = userId ?? get().resolveCurrentUserId();
        return getDefaultApiTokenIdForUser(resolvedUserId);
      },
      setDefaultApiTokenId: (tokenId, userId = null) => {
        const resolvedUserId = userId ?? get().resolveCurrentUserId();
        setDefaultApiTokenIdForUser(resolvedUserId, tokenId);
      },
      setDefaultApiTokenIdAndRefreshCache: async (tokenId, userId = null) => {
        const resolvedUserId = userId ?? get().resolveCurrentUserId();
        const normalizedTokenId = Number(tokenId);
        if (
          resolvedUserId == null ||
          !Number.isFinite(normalizedTokenId) ||
          normalizedTokenId <= 0
        ) {
          return false;
        }
        const keyResult = await api.post(`/api/token/${normalizedTokenId}/key`);
        const fullKey = keyResult.data?.key;
        if (!fullKey) return false;
        setDefaultApiTokenIdForUser(resolvedUserId, normalizedTokenId);
        try {
          localStorage.setItem(
            `active_api_token:user:${resolvedUserId}`,
            fullKey.startsWith("sk-") ? fullKey : `sk-${fullKey}`,
          );
        } catch {
          // ignore
        }
        return true;
      },
      clearDefaultApiTokenId: (userId = null) => {
        const resolvedUserId = userId ?? get().resolveCurrentUserId();
        clearDefaultApiTokenIdForUser(resolvedUserId);
      },

      login: async (username, password, turnstileToken = "") => {
        set({ isLoading: true });
        try {
          // New-API 登录成功后通过 session cookie 建立认证，data.data 是用户基本信息对象
          // 先将 data.data 中的 id 存入 store，确保 fetchSelf() 发请求时 New-Api-User header 不为空
          const data = await api.post(
            `/api/user/login?turnstile=${turnstileToken}`,
            {
              username,
              password,
            },
          );
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
        turnstileToken = "",
      }) => {
        set({ isLoading: true });
        try {
          await api.post(`/api/user/register?turnstile=${turnstileToken}`, {
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
          applyUserLanguageFromProfile(user);
        } catch {
          switchStoresToUserScope(null);
          set({
            user: null,
            isAuthenticated: false,
            sessionToken: "",
          });
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
      updateEmail: async (email, code) => {
        try {
          await api.get(`/api/oauth/email/bind?email=${email}&code=${code}`);
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
        isAuthenticated: state.isAuthenticated,
      }),
    },
  ),
);
