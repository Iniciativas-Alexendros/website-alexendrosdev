"use client";

import {
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ArrowSquareOut,
  ArrowUp,
  ArrowUpRight,
  Calendar,
  CaretDown,
  CaretLeft,
  CaretRight,
  CaretUp,
  Check,
  Download,
  Envelope,
  EnvelopeSimple,
  EyeSlash,
  Funnel,
  GitBranch,
  GithubLogo,
  Globe,
  GridFour,
  Heart,
  Info,
  LinkedinLogo,
  List,
  Lock,
  MagnifyingGlass,
  MapPin,
  Minus,
  Moon,
  Plus,
  Shield,
  ShieldCheck,
  Star,
  Sun,
  Terminal,
  Trash,
  Users,
  UsersThree,
  Warning,
  Waveform,
  X,
} from "@phosphor-icons/react";
import type { CSSProperties, ComponentType } from "react";

type PhosphorIconComponent = ComponentType<{
  size?: number;
  weight?: "thin" | "light" | "regular" | "bold" | "fill" | "duotone";
  color?: string;
}>;

const ICON_MAP: Record<string, PhosphorIconComponent> = {
  activity: Waveform,
  "alert-circle": Warning,
  "arrow-down": ArrowDown,
  "arrow-left": ArrowLeft,
  "arrow-right": ArrowRight,
  "arrow-square-out": ArrowSquareOut,
  "arrow-up": ArrowUp,
  "arrow-up-right": ArrowUpRight,
  "caret-down": CaretDown,
  "caret-left": CaretLeft,
  "caret-right": CaretRight,
  "caret-up": CaretUp,
  calendar: Calendar,
  check: Check,
  download: Download,
  envelope: Envelope,
  "envelope-simple": EnvelopeSimple,
  "external-link": ArrowSquareOut,
  "eye-slash": EyeSlash,
  filter: Funnel,
  "folder-open": GridFour,
  "git-branch": GitBranch,
  github: GithubLogo,
  "github-logo": GithubLogo,
  globe: Globe,
  "grid-four": GridFour,
  heart: Heart,
  info: Info,
  "linkedin-logo": LinkedinLogo,
  list: List,
  lock: Lock,
  mail: EnvelopeSimple,
  "magnifying-glass": MagnifyingGlass,
  "map-pin": MapPin,
  minus: Minus,
  moon: Moon,
  plus: Plus,
  shield: Shield,
  "shield-check": ShieldCheck,
  star: Star,
  sun: Sun,
  terminal: Terminal,
  trash: Trash,
  users: Users,
  "users-three": UsersThree,
  warning: Warning,
  waveform: Waveform,
  x: X,
} satisfies Record<string, PhosphorIconComponent>;

export type IconName = keyof typeof ICON_MAP;

interface IconProps {
  name: IconName;
  size?: number;
  weight?: "thin" | "light" | "regular" | "bold" | "fill" | "duotone";
  color?: string;
  style?: CSSProperties;
  className?: string;
}

export function Icon({ name, size = 18, weight = "regular", color, style, className }: IconProps) {
  const Cmp = ICON_MAP[name];
  if (!Cmp) return null;
  return (
    <span className={className} style={{ display: "inline-flex", ...style }} aria-hidden>
      <Cmp size={size} weight={weight} color={color} />
    </span>
  );
}
