import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { buildUserScopedStorageKey } from './persistScope'

const SETTINGS_STORAGE_BASE_KEY = 'settings-storage'

export const useSettingsStore = create(
  persist(
    (set) => ({
      theme: 'light',      // 'light' | 'dark' | 'system'
      language: 'zh',      // 'zh' | 'en'

      setTheme: (theme) => set({ theme }),
      setLanguage: (language) => set({ language }),

      switchPersistUser: (userId) => {
        const scopedKey = buildUserScopedStorageKey(SETTINGS_STORAGE_BASE_KEY, userId)
        useSettingsStore.persist.setOptions({
          name: scopedKey,
        })
        const hasScopedState =
          typeof window !== 'undefined' &&
          window.localStorage.getItem(scopedKey) !== null

        if (hasScopedState) {
          useSettingsStore.persist.rehydrate()
          return
        }

        useSettingsStore.setState({
          theme: 'light',
          language: 'zh',
        })
      },
    }),
    {
      name: buildUserScopedStorageKey(SETTINGS_STORAGE_BASE_KEY, null),
    }
  )
)
