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

const savedLang = typeof localStorage !== "undefined" ? localStorage.getItem("lang") : null
if (savedLang === "zh" || savedLang === "en") {
  i18n.changeLanguage(savedLang)
} else {
  i18n.changeLanguage("en")
  if (typeof localStorage !== "undefined") localStorage.setItem("lang", "en")
}

i18n.on("languageChanged", (lng) => {
  if (typeof localStorage !== "undefined") localStorage.setItem("lang", lng)
})

export default i18n

