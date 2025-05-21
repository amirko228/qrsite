// Типы блоков
export enum BlockType {
  TEXT = 'text',
  PHOTO = 'photo',
  VIDEO = 'video',
  SOCIAL = 'social',
  PROFILE = 'profile',
  FAMILY_TREE = 'familyTree'
}

// Шаблоны блоков по типам
export const BlockTemplates = {
  [BlockType.TEXT]: [
    { id: 'rounded-square', name: 'Квадрат с закругленными углами' },
    { id: 'circle', name: 'Круг' },
    { id: 'rounded-rectangle', name: 'Прямоугольник закругленный' },
    { id: 'semicircle', name: 'Полукруг' }
  ],
  [BlockType.PHOTO]: [
    { id: 'gallery', name: 'Галерея на всю ширину' },
    { id: 'banner', name: 'Баннер на всю ширину' },
    { id: 'rounded-square', name: 'Квадрат со скошенными углами' },
    { id: 'circle', name: 'Круг' }
  ],
  [BlockType.VIDEO]: [
    { id: 'gallery', name: 'Галерея на всю ширину' },
    { id: 'rounded-square', name: 'Квадрат со скошенными углами' }
  ],
  [BlockType.SOCIAL]: [
    { id: 'circle', name: 'Круг с иконкой' },
    { id: 'bar', name: 'Прямоугольник на всю ширину' },
    { id: 'separate', name: 'Отдельные иконки' }
  ],
  [BlockType.PROFILE]: [
    { id: 'full-width', name: 'Страница памяти на всю ширину' },
    { id: 'square', name: 'Карточка памяти квадратная' },
    { id: 'form', name: 'Форма с информацией о человеке' }
  ],
  [BlockType.FAMILY_TREE]: [
    { id: 'standard', name: 'Стандартное древо' }
  ]
};

// Типы размеров блоков
export enum BlockSizeType {
  SQUARE = 'square',
  MEDIUM = 'medium',
  THIN_FULL = 'thin_full',
  WIDE_FULL = 'wide_full',
  TALL = 'tall',
  BANNER = 'banner',
  GALLERY = 'gallery'
}

// Типы позиций блоков
export enum BlockPositionType {
  LEFT = 'left',
  CENTER = 'center',
  RIGHT = 'right',
  FULL = 'full'
}

// Типы социальных сетей (только разрешенные)
export enum SocialNetworkType {
  VK = 'vk',
  TELEGRAM = 'telegram',
  ODNOKLASSNIKI = 'ok'
}

// Интерфейс данных члена семьи для генеалогического древа
export interface FamilyMember {
  id: string;
  fullName: string;
  photo?: string;
  birthDate?: string;
  deathDate?: string;
  relationshipType?: 'parent' | 'child' | 'spouse' | 'sibling';
  relationTo?: string; // ID другого члена семьи
  socialNetwork?: {
    type: SocialNetworkType;
    url: string;
  };
  socialLink?: string; // Ссылка на профиль в социальной сети (для обратной совместимости)
  age?: number;
  isApproved: boolean;
  pendingRequestId?: string;
  gender?: 'male' | 'female';
}

// Интерфейс профиля человека
export interface ProfileInfo {
  fullName?: string;
  firstName?: string;
  lastName?: string;
  middleName?: string;
  photo?: string;
  birthDate?: string;
  deathDate?: string;
  description?: string;
  religion?: string;
  birthPlace?: string;
  deathPlace?: string;
  occupation?: string;
}

// Интерфейс для медиа элемента (фото или видео)
export interface MediaItem {
  id: string;
  url: string;
  thumbnail?: string;
  title?: string;
  description?: string;
  uploadDate?: string;
}

// Интерфейс для содержимого блока
export interface BlockContent {
  text?: string;
  title?: string;
  images?: string[];
  mediaItems?: MediaItem[];
  videos?: string[];
  videoUrl?: string;
  socialUrl?: string;
  socialType?: SocialNetworkType;
  socialNetworks?: {
    type: SocialNetworkType;
    url: string;
  }[];
  profileInfo?: ProfileInfo;
  familyMembers?: FamilyMember[];
  pendingConnections?: FamilyMember[];
}

// Интерфейс для стиля блока
export interface BlockStyle {
  backgroundColor: string;
  color: string;
  borderColor: string;
  borderRadius: string;
  borderWidth?: string;
  shadowIntensity?: 'none' | 'light' | 'medium' | 'strong';
  opacity?: number;
}

// Интерфейс для блока
export interface Block {
  id: string;
  type: BlockType;
  template: string;
  content: BlockContent;
  position: {
    row: number;
    column: number;
  };
  size: {
    width: number;
    height: number;
  };
  style: BlockStyle;
  isFixed: boolean;
}

// Конфигурация сетки
export interface GridConfig {
  columns: number;
  gutterSize: number;
  cellSize: number;
} 