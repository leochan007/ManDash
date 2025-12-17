import i18n from "i18next"
import { initReactI18next } from "react-i18next"

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

const getInitialLang = () => {
  try {
    const saved = localStorage.getItem("lang")
    if (saved === "zh" || saved === "en") return saved
    
    if (typeof navigator !== "undefined" && navigator.language) {
      if (navigator.language.startsWith("zh")) return "zh"
    }
  } catch {}
  return "en"
}

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: getInitialLang(),
    fallbackLng: "en",
    defaultNS: "translation",
    interpolation: {
      escapeValue: false
    },
    load: "languageOnly"
  })

i18n.on("languageChanged", (lng) => {
  try {
    localStorage.setItem("lang", lng)
  } catch {}
})

export default i18n
