import * as Lucide from 'lucide-react-native';
import { COLORS } from '../config/colors';

const nameToPascal = {
  'menu': 'Menu',
  'home': 'Home',
  'graduation-cap': 'GraduationCap',
  'book': 'Book',
  'book-open': 'BookOpen',
  'calendar': 'Calendar',
  'check-square': 'CheckSquare',
  'check': 'Check',
  'x': 'X',
  'wallet': 'Wallet',
  'bar-chart-3': 'BarChart3',
  'shopping-cart': 'ShoppingCart',
  'target': 'Target',
  'file-text': 'FileText',
  'link': 'Link',
  'flame': 'Flame',
  'plus': 'Plus',
  'trash-2': 'Trash2',
  'download': 'Download',
  'upload': 'Upload',
  'pencil': 'Pencil',
  'settings': 'Settings',
  'user': 'User',
  'bell': 'Bell',
  'trending-up': 'TrendingUp',
  'trending-down': 'TrendingDown',
  'zap': 'Zap',
  'landmark': 'Landmark',
  'lightbulb': 'Lightbulb',
  'globe': 'Globe',
  'rocket': 'Rocket',
  'check-circle': 'CheckCircle',
  'alert-triangle': 'AlertTriangle',
  'sparkles': 'Sparkles',
  'list': 'List',
  // Added for the M3 redesign primitives/screens.
  'chevron-right': 'ChevronRight',
  'chevron-left': 'ChevronLeft',
  'chevron-down': 'ChevronDown',
  'chevron-up': 'ChevronUp',
  'clock': 'Clock',
  'search': 'Search',
  'heart': 'Heart',
  'share-2': 'Share2',
  'more-vertical': 'MoreVertical',
  'ellipsis-vertical': 'EllipsisVertical',
  'external-link': 'ExternalLink',
  'alert-circle': 'AlertCircle',
  'info': 'Info',
  'arrow-right': 'ArrowRight',
  'arrow-left': 'ArrowLeft',
  'arrow-up': 'ArrowUp',
  'refresh-cw': 'RefreshCw',
  'sun': 'Sun',
  'moon': 'Moon',
  'mic': 'Mic',
  'grid': 'LayoutGrid',
  'shapes': 'Shapes',
  'layers': 'Layers',
  'folder': 'Folder',
  'lock': 'Lock',
  'shield-check': 'ShieldCheck',
};

export function Icon({ name, size = 20, color = COLORS.text, strokeWidth = 2 }) {
  const key = nameToPascal[name] || name;
  const LucideIcon = Lucide[key];
  if (!LucideIcon) {
    console.warn(`[Icon] unknown icon: ${name} (mapped to ${key})`);
    return null;
  }
  return <LucideIcon size={size} color={color} strokeWidth={strokeWidth} />;
}