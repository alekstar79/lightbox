import { Plugin } from './core/plugin'

import { DirectionalHoverPlugin } from './plugins/directional-hover'
import { ParallaxColumnsPlugin } from './plugins/parallax-columns'
import { create, ready } from './factory'

import './styles/main.scss'

/* ------------------------------------------------------------------ */
/* Theme switcher (demo-only concern; not part of the library).       */
/* ------------------------------------------------------------------ */

const THEME_STORAGE_KEY = 'lightbox-demo-theme'
const THEMES = ['base', 'dark', 'minimal', 'glass'] as const
type ThemeName = typeof THEMES[number]

const themeSelect = document.querySelector('#theme-select') as HTMLSelectElement

const isThemeName = (value: string): value is ThemeName =>
  (THEMES as readonly string[]).includes(value)

const readStoredTheme = (): ThemeName | null => {
  const stored = localStorage.getItem(THEME_STORAGE_KEY)
  return stored && isThemeName(stored) ? stored : null
}

const applyTheme = (name: ThemeName): void => {
  if (name === 'base') {
    delete document.documentElement.dataset.theme
  } else {
    document.documentElement.dataset.theme = name
  }
  localStorage.setItem(THEME_STORAGE_KEY, name)
  themeSelect.value = name
}

const initialTheme: ThemeName =
  readStoredTheme()
  ?? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'base')

applyTheme(initialTheme)

themeSelect.addEventListener('change', () => {
  if (isThemeName(themeSelect.value)) {
    applyTheme(themeSelect.value)
  }
})

/* ------------------------------------------------------------------ */
/* Gallery / lightbox demo                                            */
/* ------------------------------------------------------------------ */

const source = Array.from({ length: 44 }, (_, i) => ({
  src: `images/img-${`${i + 1}`.padStart(2, '0')}.jpg`,
}))

const thumb = Array.from({ length: 44 }, (_, i) => ({
  src: `thumb/img-${`${i + 1}`.padStart(2, '0')}.jpg`,
}))

await ready()

const checkbox = document.querySelector('input[type="checkbox"]') as HTMLInputElement
const refresh = document.querySelector('.refresh-btn') as HTMLElement

const getPlugins = (): Plugin[] => {
  const plugins: Plugin[] = [new ParallaxColumnsPlugin()]

  if (checkbox.checked) {
    plugins.push(new DirectionalHoverPlugin())
  }

  return plugins
}

const app = create({
  gallerySelector: '.wrapper',
  plugins: getPlugins(),
  source,
  thumb
})

checkbox.addEventListener('change', () => {
  app.setPlugins(getPlugins())
})

refresh.addEventListener('click', () => {
  app.gallery.render()
  app.reapplyPlugins()
})

window.addEventListener('beforeunload', () => {
  app.destroy()
})
