import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";

import enTranslation from "./locales/en.json";
import zhCNTranslation from "./locales/zh-CN.json";
import zhTWTranslation from "./locales/zh-TW.json";
import { supportedLanguages } from "./language";

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    load: "currentOnly",
    supportedLngs: supportedLanguages,
    resources: {
      en: enTranslation,
      "zh-CN": zhCNTranslation,
      "zh-TW": zhTWTranslation,
    },
    fallbackLng: "zh-CN",
    nsSeparator: false,
    keySeparator: false,
    interpolation: {
      escapeValue: false,
    },
    detection: {
      order: ["localStorage", "navigator"],
      caches: ["localStorage"],
      lookupLocalStorage: "i18nextLng",
    },
  });

export default i18n;
