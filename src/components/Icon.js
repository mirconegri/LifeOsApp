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