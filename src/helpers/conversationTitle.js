import i18n from "../i18n/i18n";
import { DEFAULT_CHAT_TITLE_I18N_KEY } from "../lib/config";

export function displayConversationTitle(stored) {
  if (!stored || stored === DEFAULT_CHAT_TITLE_I18N_KEY) {
    return i18n.t(DEFAULT_CHAT_TITLE_I18N_KEY);
  }
  return stored;
}

export function conversationTitleMatchesSearch(stored, query) {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  if ((stored || "").toLowerCase().includes(q)) return true;
  if (!stored || stored === DEFAULT_CHAT_TITLE_I18N_KEY) {
    return i18n.t(DEFAULT_CHAT_TITLE_I18N_KEY).toLowerCase().includes(q);
  }
  return false;
}
