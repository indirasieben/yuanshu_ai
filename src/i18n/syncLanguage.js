import i18n from "./i18n";
import { apiLanguageToI18n } from "./language";

/** 登录/拉取用户后根据服务端 Language 同步界面语言 */
export function applyUserLanguageFromProfile(user) {
  try {
    const setting =
      typeof user?.setting === "string"
        ? JSON.parse(user.setting)
        : user?.setting || {};
    const apiLang = setting.Language;
    if (!apiLang) return;
    const lng = apiLanguageToI18n(apiLang);
    if (!lng || lng === i18n.language) return;
    i18n.changeLanguage(lng);
    localStorage.setItem("i18nextLng", lng);
  } catch {
    /* ignore */
  }
}
