import { createI18n } from 'vue-i18n'
import zhCN from './zh-CN'
import enUS from './en-US'

export type LocaleCode = 'zh-CN' | 'en-US'

const STORAGE_KEY = 'mc-docs-locale'

export const SUPPORTED_LOCALES: Array<{ value: LocaleCode; label: string }> = [
  { value: 'zh-CN', label: '中文' },
  { value: 'en-US', label: 'English' },
]

// 首次访问跟随浏览器语言，之后记住用户选择
const browserLocale: LocaleCode = navigator.language.toLowerCase().startsWith('zh') ? 'zh-CN' : 'en-US'
const initialLocale = (localStorage.getItem(STORAGE_KEY) as LocaleCode) || browserLocale

export const i18n = createI18n({
  legacy: false, // 必须关闭，否则 <script setup> 里无法使用 useI18n()
  locale: initialLocale,
  fallbackLocale: 'zh-CN',
  messages: {
    'zh-CN': zhCN,
    'en-US': enUS,
  },
})

export function setLocale(value: LocaleCode) {
  i18n.global.locale.value = value
  localStorage.setItem(STORAGE_KEY, value)
  document.documentElement.lang = value
}

document.documentElement.lang = initialLocale
