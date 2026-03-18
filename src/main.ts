import { createLightbox } from './factory'
import './styles/main.scss'

window.addEventListener('DOMContentLoaded', () => {
  const source = Array.from({ length: 28 }, (_, i) => ({
    src: `img-${`${i + 1}`.padStart(2, '0')}.jpg`,
  }))

  createLightbox({
    source,
    gallerySelector: '.wrapper',
  })
})
