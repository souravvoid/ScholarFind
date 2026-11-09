import {
  ArrowLeft,
  ArrowRight,
  BadgeCheck,
  Bookmark,
  BookmarkCheck,
  Building2,
  CalendarClock,
  CalendarDays,
  ChevronRight,
  CircleCheck,
  CircleHelp,
  CircleX,
  Clock,
  Code2,
  ExternalLink,
  Eye,
  EyeOff,
  FileText,
  Filter,
  Globe,
  GraduationCap,
  House,
  Info,
  ListChecks,
  LogOut,
  Mail,
  MapPin,
  Menu,
  RefreshCw,
  School,
  Search,
  ShieldX,
  SlidersHorizontal,
  TriangleAlert,
  User,
  Wallet,
  X,
  type LucideIcon,
} from 'lucide-react';

/**
 * Single icon entry point. Pages never import lucide directly; semantics live here
 * so the same concept looks the same on every route (docs/DESIGN_SYSTEM.md §4).
 */
const ICONS = {
  home: House,
  explore: Search,
  filters: SlidersHorizontal,
  filter: Filter,
  saved: Bookmark,
  savedActive: BookmarkCheck,
  deadline: CalendarClock,
  calendar: CalendarDays,
  eligible: CircleCheck,
  missing: CircleX,
  manual: CircleHelp,
  verified: BadgeCheck,
  unverified: TriangleAlert,
  blocked: ShieldX,
  external: ExternalLink,
  eye: Eye,
  eyeOff: EyeOff,
  search: Search,
  country: Globe,
  degree: GraduationCap,
  funding: Wallet,
  provider: Building2,
  document: FileText,
  checklist: ListChecks,
  mail: Mail,
  code: Code2,
  clock: Clock,
  location: MapPin,
  info: Info,
  refresh: RefreshCw,
  school: School,
  user: User,
  signOut: LogOut,
  menu: Menu,
  close: X,
  chevronRight: ChevronRight,
  arrowRight: ArrowRight,
  arrowLeft: ArrowLeft,
} satisfies Record<string, LucideIcon>;

export type IconName = keyof typeof ICONS;

interface IconProps {
  name: IconName;
  size?: number;
  className?: string;
  /** Accessible label. Omit for decorative icons (they are hidden from AT). */
  label?: string;
  strokeWidth?: number;
}

export function Icon({ name, size = 18, className, label, strokeWidth = 1.75 }: IconProps) {
  const Component = ICONS[name];
  return (
    <Component
      width={size}
      height={size}
      strokeWidth={strokeWidth}
      className={className}
      aria-hidden={label ? undefined : true}
      aria-label={label}
      role={label ? 'img' : undefined}
      focusable="false"
    />
  );
}
