import { Plugin } from './core/plugin'

import { DirectionalHoverPlugin } from './plugins/directional-hover'
import { ParallaxColumnsPlugin } from './plugins/parallax-columns'
import { create, ready } from './factory'

import './styles/main.scss'

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
