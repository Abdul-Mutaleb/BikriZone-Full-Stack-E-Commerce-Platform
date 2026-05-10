import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { translations } from '../i18n/translations'

const useLanguageStore = create(
  persist(
    (set, get) => ({
      lang: 'en',
      setLang: (lang) => set({ lang }),
      t: (key) => {
        const { lang } = get()
        return translations[lang]?.[key] ?? translations['en']?.[key] ?? key
      },
    }),
    { name: 'megabazar-lang' }
  )
)

export default useLanguageStore
