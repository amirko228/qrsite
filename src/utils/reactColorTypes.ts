// Файл-обертка для импорта react-color компонентов
// Решает проблему с типами в проекте
import * as ReactColor from 'react-color';

// Реэкспортируем нужные компоненты
export const SketchPicker = ReactColor.SketchPicker;

// Экспортируем все типы через интерфейс
export interface ColorResult {
  hex: string;
  rgb: { r: number; g: number; b: number; a?: number };
  hsl: { h: number; s: number; l: number; a?: number };
}

export default ReactColor; 