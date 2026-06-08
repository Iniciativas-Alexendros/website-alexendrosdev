import {
  Activity,
  AlertCircle,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ArrowUpDown,
  ArrowUpRight,
  Calendar,
  Check,
  ChevronLeft,
  ChevronRight,
  Download,
  ExternalLink,
  EyeOff,
  GitBranch,
  Info,
  LocateFixed,
  Lock,
  Mail,
  Menu,
  Minus,
  Moon,
  Plus,
  Search,
  Shield,
  Star,
  Sun,
  Terminal,
  Users,
  X,
  type LucideIcon,
} from "lucide-react";
import type { CSSProperties } from "react";

const ICONS = {
  activity: Activity,
  "alert-circle": AlertCircle,
  "arrow-down": ArrowDown,
  "arrow-left": ArrowLeft,
  "arrow-right": ArrowRight,
  "arrow-up-down": ArrowUpDown,
  "arrow-up-right": ArrowUpRight,
  calendar: Calendar,
  check: Check,
  "chevron-left": ChevronLeft,
  "chevron-right": ChevronRight,
  download: Download,
  "external-link": ExternalLink,
  "eye-off": EyeOff,
  "git-branch": GitBranch,
  info: Info,
  "locate-fixed": LocateFixed,
  lock: Lock,
  mail: Mail,
  menu: Menu,
  minus: Minus,
  moon: Moon,
  plus: Plus,
  search: Search,
  shield: Shield,
  star: Star,
  sun: Sun,
  terminal: Terminal,
  users: Users,
  x: X,
} satisfies Record<string, LucideIcon>;

// Iconos de marca (lucide-react v1 eliminó los logos): SVG inline (paths de Simple Icons).
const BRAND_PATHS = {
  github:
    "M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0 1 12 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222 0 1.606-.014 2.898-.014 3.293 0 .322.216.694.825.576C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12",
  linkedin:
    "M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z",
  twitter:
    "M18.901 1.153h3.68l-8.04 9.19L24 22.846h-7.406l-5.8-7.584-6.638 7.584H.474l8.6-9.83L0 1.154h7.594l5.243 6.932ZM17.61 20.644h2.039L6.486 3.24H4.298Z",
} as const;

export type IconName = keyof typeof ICONS | keyof typeof BRAND_PATHS;

interface IconProps {
  name: IconName;
  size?: number;
  className?: string;
  style?: CSSProperties;
}

export function Icon({ name, size = 18, className, style }: IconProps) {
  const brand = BRAND_PATHS[name as keyof typeof BRAND_PATHS];
  if (brand) {
    return (
      <span className={className} style={{ display: "inline-flex", ...style }} aria-hidden>
        <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" role="img">
          <path d={brand} />
        </svg>
      </span>
    );
  }

  const Cmp = ICONS[name as keyof typeof ICONS];
  if (!Cmp) return null;
  return (
    <span className={className} style={{ display: "inline-flex", ...style }} aria-hidden>
      <Cmp width={size} height={size} />
    </span>
  );
}
