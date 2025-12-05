import i18n from "i18next"
import { initReactI18next } from "react-i18next"
import LanguageDetector from "i18next-browser-languagedetector"

import zh from "./locales/zh.json"
import en from "./locales/en.json"

const resources = {
  zh: {
    translation: zh
  },
  en: {
    translation: en
  }
}

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: "zh",
    defaultNS: "translation",
    interpolation: {
      escapeValue: false
    },
    detection: {
      order: ["localStorage", "navigator"],
      caches: ["localStorage"],
      lookupLocalStorage: "i18nextLng"
    }
  })

// 从 Chrome storage 同步语言设置
chrome.storage?.local.get(["lang"]).then((res) => {
  if (res.lang && (res.lang === "zh" || res.lang === "en")) {
    i18n.changeLanguage(res.lang)
  }
})

// 监听语言变化，保存到 Chrome storage
i18n.on("languageChanged", (lng) => {
  chrome.storage?.local.set({ lang: lng })
})

export default i18n

