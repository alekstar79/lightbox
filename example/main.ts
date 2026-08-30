import { create, ready, DirectionalHoverPlugin } from '@alekstar79/lightbox'
import type { LightboxOptions, ImageSource } from '@alekstar79/lightbox'

import '@alekstar79/lightbox/lib/index.css'
import '@alekstar79/lightbox/lib/directional-hover.css'
import './styles.scss'

(async () => {
  const source: ImageSource[] = Array.from({ length: 28 }, (_, i) => ({
    src: `images/img-${`${i + 1}`.padStart(2, '0')}.jpg`,
  }))

  const thumb: ImageSource[] = Array.from({ length: 28 }, (_, i) => ({
    src: `thumb/img-${`${i + 1}`.padStart(2, '0')}.jpg`,
  }))

  await ready()

  const checkbox = document.querySelector('input[type="checkbox"]') as HTMLInputElement
  const refresh = document.querySelector('.refresh-btn') as HTMLElement

  const getPlugins = () => checkbox.checked ? [new DirectionalHoverPlugin()] : []

  const app = create({
    gallerySelector: '.wrapper',
    plugins: getPlugins(),
    source,
    thumb
  } as LightboxOptions)

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
