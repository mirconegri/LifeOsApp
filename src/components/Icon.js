import * as LucideIcons from 'lucide-react-native';
import { COLORS } from '../config/colors';

export function Icon({ name, size = 20, color = COLORS.text, strokeWidth = 2 }) {
  const LucideIcon = LucideIcons[name];
  if (!LucideIcon) {
    console.warn(`[Icon] unknown icon: ${name}`);
    return null;
  }
  return <LucideIcon size={size} color={color} strokeWidth={strokeWidth} />;
}