import {
  ArrowRight,
  ArrowLeft,
  ArrowUp,
  ArrowDown,
  Check,
  X,
  Menu,
  Search,
  Home,
  User,
  Settings,
  Mail,
  Github,
  Linkedin,
  ExternalLink,
  Download,
  Sun,
  Moon,
  ChevronRight,
  ChevronLeft,
  ChevronUp,
  ChevronDown,
  Plus,
  Minus,
  Eye,
  EyeOff,
  Heart,
  Star,
  Briefcase,
  Code,
  Globe,
  Phone,
  LucideIconData,
} from 'lucide-angular';
import { IconProvider } from '../icon-provider.interface';

const ICON_MAP: Record<string, LucideIconData> = {
  'arrow-right': ArrowRight,
  'arrow-left': ArrowLeft,
  'arrow-up': ArrowUp,
  'arrow-down': ArrowDown,
  check: Check,
  close: X,
  x: X,
  menu: Menu,
  search: Search,
  home: Home,
  user: User,
  settings: Settings,
  mail: Mail,
  github: Github,
  linkedin: Linkedin,
  'external-link': ExternalLink,
  download: Download,
  sun: Sun,
  moon: Moon,
  'chevron-right': ChevronRight,
  'chevron-left': ChevronLeft,
  'chevron-up': ChevronUp,
  'chevron-down': ChevronDown,
  plus: Plus,
  minus: Minus,
  eye: Eye,
  'eye-off': EyeOff,
  heart: Heart,
  star: Star,
  briefcase: Briefcase,
  code: Code,
  globe: Globe,
  phone: Phone,
};

export class LucideIconProvider implements IconProvider {
  getSvg(name: string, size: number): string | null {
    const iconData = ICON_MAP[name];
    if (!iconData) return null;

    const children = iconData
      .map(([tag, attrs]) => {
        const attrStr = Object.entries(attrs)
          .filter(([key]) => key !== 'key')
          .map(([key, value]) => `${key}="${value}"`)
          .join(' ');
        return `<${tag} ${attrStr} />`;
      })
      .join('');

    return (
      `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" ` +
      `viewBox="0 0 24 24" fill="none" stroke="currentColor" ` +
      `stroke-width="2" stroke-linecap="round" stroke-linejoin="round">` +
      `${children}</svg>`
    );
  }

  getSupportedIcons(): string[] {
    return Object.keys(ICON_MAP);
  }
}

export const lucideProvider = new LucideIconProvider();
