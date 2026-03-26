export const supportedLanguages = ["zh-CN", "zh-TW", "en"];

export function normalizeLanguage(language) {
  if (!language) return language;
  const normalized = language.trim().replace(/_/g, "-");
  const lower = normalized.toLowerCase();
  if (
    lower === "zh" ||
    lower === "zh-cn" ||
    lower === "zh-sg" ||
    lower.startsWith("zh-hans")
  ) {
    return "zh-CN";
  }
  if (
    lower === "zh-tw" ||
    lower === "zh-hk" ||
    lower === "zh-mo" ||
    lower.startsWith("zh-hant")
  ) {
    return "zh-TW";
  }
  if (lower === "en") return "en";
  const matched = supportedLanguages.find(
    (s) => s.toLowerCase() === lower,
  );
  return matched || "zh-CN";
}

/** new-api 用户 setting.Language：zh-Hans / zh-Hant / en */
export function apiLanguageToI18n(api) {
  if (!api) return null;
  if (api === "zh-Hans" || api === "zh_CN") return "zh-CN";
  if (api === "zh-Hant" || api === "zh_TW") return "zh-TW";
  if (api === "en") return "en";
  return normalizeLanguage(api);
}

export function i18nToApiLanguage(i18nLang) {
  if (!i18nLang) return null;
  if (i18nLang === "zh-CN") return "zh-Hans";
  if (i18nLang === "zh-TW") return "zh-Hant";
  if (i18nLang === "en") return "en";
  return null;
}
