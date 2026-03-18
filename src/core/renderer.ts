interface RendererOptions {
  minScale: number;
  maxScale: number;
  element: HTMLElement;
  scaleSensitivity?: number;
}

interface Transformation {
  translateX: number;
  translateY: number;
  originX: number;
  originY: number;
  scale: number;
}

export class Renderer {
  private readonly state: {
    element: HTMLElement;
    minScale: number;
    maxScale: number;
    scaleSensitivity: number;
    transformation: Transformation;
  }

  constructor({ minScale, maxScale, element, scaleSensitivity = 10 }: RendererOptions) {
    this.state = {
      element,
      minScale,
      maxScale,
      scaleSensitivity,
      transformation: {
        translateX: 0,
        translateY: 0,
        originX: 0,
        originY: 0,
        scale: 1
      }
    }
  }

  private static valueInRange = ({ minScale, maxScale, scale }: { minScale: number; maxScale: number; scale: number }) =>
    scale <= maxScale && scale >= minScale

  private static hasPositionChanged = ({ pos, prevPos }: { pos: number; prevPos: number }) => pos !== prevPos

  private static getTranslate = ({ minScale, maxScale, scale }: { minScale: number; maxScale: number; scale: number }) =>
    ({ pos, prevPos, translate }: { pos: number; prevPos: number; translate: number }) =>
      Renderer.valueInRange({ minScale, maxScale, scale }) &&
      Renderer.hasPositionChanged({ pos, prevPos })
        ? translate + (pos - prevPos * scale) * (1 - 1 / scale)
        : translate

  private static getScale = ({ scale, minScale, maxScale, scaleSensitivity, deltaScale }: { scale: number; minScale: number; maxScale: number; scaleSensitivity: number; deltaScale: number }) => {
    let newScale = scale + (deltaScale / (scaleSensitivity / scale))
    newScale = Math.max(minScale, Math.min(newScale, maxScale))
    return [scale, newScale]
  }

  private static getMatrix = ({ scale, translateX, translateY, skewX = 0, skewY = 0 }: { scale: number; translateX: number; translateY: number; skewX?: number; skewY?: number }) =>
    `matrix(${scale}, ${skewX}, ${skewY}, ${scale}, ${translateX}, ${translateY})`

  public zoom({ x, y, deltaScale }: { x: number; y: number; deltaScale: number }): void {
    const { left, top } = this.state.element.getBoundingClientRect()
    const { minScale, maxScale, scaleSensitivity } = this.state
    const [scale, newScale] = Renderer.getScale({
      scale: this.state.transformation.scale,
      scaleSensitivity,
      deltaScale,
      minScale,
      maxScale
    })

    const originX = x - left
    const originY = y - top

    const newOriginX = originX / scale
    const newOriginY = originY / scale

    const translate = Renderer.getTranslate({ scale, minScale, maxScale })

    const translateX = translate({
      translate: this.state.transformation.translateX,
      prevPos: this.state.transformation.originX,
      pos: originX
    })

    const translateY = translate({
      translate: this.state.transformation.translateY,
      prevPos: this.state.transformation.originY,
      pos: originY
    })

    this.state.element.style.transformOrigin = `${newOriginX}px ${newOriginY}px`
    this.state.element.style.transform = Renderer.getMatrix({
      scale: newScale,
      translateX,
      translateY
    })

    this.state.transformation = {
      originX: newOriginX,
      originY: newOriginY,
      scale: newScale,
      translateX,
      translateY
    }
  }

  public pan({ originX, originY }: { originX: number; originY: number }): void {
    this.state.transformation.translateX += originX
    this.state.transformation.translateY += originY

    this.state.element.style.transform = Renderer.getMatrix({
      translateX: this.state.transformation.translateX,
      translateY: this.state.transformation.translateY,
      scale: this.state.transformation.scale
    })
  }

  public panTo({ originX, originY, scale }: { originX: number; originY: number; scale: number }): void {
    this.state.transformation.scale = scale
    this.pan({
      originX: originX - this.state.transformation.translateX,
      originY: originY - this.state.transformation.translateY
    })
  }

  public panBy({ originX, originY }: { originX: number; originY: number }): void {
    this.pan({ originX, originY })
  }
}
