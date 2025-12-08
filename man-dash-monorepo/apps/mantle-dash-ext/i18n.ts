import i18n from "i18next"
import { initReactI18next } from "react-i18next"
import LanguageDetector from "i18next-browser-languagedetector"

import zh from "./locales/zh/message.json"
import en from "./locales/en/message.json"

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
    lng: "en",
    fallbackLng: "en",
    defaultNS: "translation",
    interpolation: {
      escapeValue: false
    },
    load: "languageOnly",
    detection: {
      order: ["localStorage", "navigator"],
      caches: ["localStorage"],
      lookupLocalStorage: "i18nextLng"
    }
  })

// 从 Chrome storage 同步语言设置
chrome.storage?.local.get(["lang"]).then((res) => {
  const lang = res.lang
  if (lang === "zh" || lang === "en") {
    i18n.changeLanguage(lang)
  } else {
    i18n.changeLanguage("en")
    chrome.storage?.local.set({ lang: "en" })
  }
})

// 监听语言变化，保存到 Chrome storage
i18n.on("languageChanged", (lng) => {
  chrome.storage?.local.set({ lang: lng })
})

export default i18n

