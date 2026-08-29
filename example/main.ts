import { create, ready, DirectionalHoverPlugin } from '@alekstar79/lightbox'

import '@alekstar79/lightbox/lib/index.css'
import '@alekstar79/lightbox/lib/directional-hover.css'
import './styles.scss'

(async () => {
  const source = Array.from({ length: 28 }, (_, i) => ({
    src: `images/img-${`${i + 1}`.padStart(2, '0')}.jpg`,
  }))

  await ready()

  const checkbox = document.querySelector('input[type="checkbox"]') as HTMLInputElement
  const refresh = document.querySelector('.refresh-btn') as HTMLElement

  const getPlugins = () => checkbox.checked ? [new DirectionalHoverPlugin()] : []

  const app = create({
    source,
    gallerySelector: '.wrapper',
    plugins: getPlugins()
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
})()
