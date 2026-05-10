import useLanguageStore from '../../store/useLanguageStore'

export default function LanguageSwitcher({ className = '' }) {
  const { lang, setLang } = useLanguageStore()

  return (
    <div className={`d-flex gap-1 align-items-center ${className}`}>
      <button
        onClick={() => setLang('en')}
        className={`btn btn-sm px-2 py-0 ${lang === 'en' ? 'btn-primary' : 'btn-outline-secondary'}`}
        style={{ fontSize: 11, lineHeight: '1.8' }}
        title="English"
      >
        EN
      </button>
      <button
        onClick={() => setLang('bn')}
        className={`btn btn-sm px-2 py-0 ${lang === 'bn' ? 'btn-primary' : 'btn-outline-secondary'}`}
        style={{ fontSize: 11, lineHeight: '1.8' }}
        title="বাংলা"
      >
        বাং
      </button>
    </div>
  )
}
