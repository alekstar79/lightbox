import { Gallery } from '../components/gallery'
import { Lightbox } from '../components/lightbox'
import { Renderer } from './renderer'
import { emitter } from './emitter'

export interface PluginContext {
  /** Экземпляр галереи */
  gallery: Gallery;
  /** Экземпляр лайтбокса */
  lightbox: Lightbox;
  /** Экземпляр рендерера (зум/пан) */
  renderer: Renderer;
  /** Глобальный событийный менеджер */
  emitter: typeof emitter;
  /** Корневой DOM-контейнер приложения */
  root: HTMLElement;
}

export interface Plugin {
  /** Уникальное имя плагина (для отладки) */
  name: string;
  /** Применяет плагин к контексту */
  apply(context: PluginContext): void;
  /** Очищает все ресурсы, созданные плагином */
  destroy?(): void;
}
