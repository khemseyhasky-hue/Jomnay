import React from 'react';
import {
  Utensils,
  Coffee,
  ShoppingBag,
  Fuel,
  Zap,
  Home,
  HeartPulse,
  GraduationCap,
  Film,
  Sparkles,
  Users,
  Briefcase,
  Store,
  Laptop,
  Gift,
  TrendingUp,
  PlusCircle,
  MoreHorizontal,
  CreditCard,
  QrCode,
  Banknote,
  Building2,
  CircleDot,
  DollarSign,
  PiggyBank,
  Wallet,
  Landmark,
  ShieldCheck,
  Lock,
  User,
  ArrowRightLeft,
  Smartphone,
  type LucideIcon,
} from 'lucide-react';

const ICON_MAP: Record<string, LucideIcon> = {
  Utensils,
  Coffee,
  ShoppingBag,
  Fuel,
  Zap,
  Home,
  HeartPulse,
  GraduationCap,
  Film,
  Sparkles,
  Users,
  Briefcase,
  Store,
  Laptop,
  Gift,
  TrendingUp,
  PlusCircle,
  MoreHorizontal,
  CreditCard,
  QrCode,
  Banknote,
  Building2,
  Smartphone,
  CircleDot,
  DollarSign,
  PiggyBank,
  Wallet,
  Landmark,
  ShieldCheck,
  Lock,
  User,
  ArrowRightLeft,
};

interface CategoryIconProps {
  name: string;
  className?: string;
  style?: React.CSSProperties;
}

export function CategoryIcon({ name, className = 'w-5 h-5', style }: CategoryIconProps) {
  const IconComponent = ICON_MAP[name] || MoreHorizontal;
  return <IconComponent className={className} style={style} />;
}
