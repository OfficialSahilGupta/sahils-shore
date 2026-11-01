"use client";

import React from "react";
import {
  Compass,
  CheckSquare,
  Activity,
  Code2,
  Layers,
  Languages,
  Briefcase,
  Wallet,
  Utensils,
  MapPin,
  Image as ImageIcon,
  BookOpen,
  FileText,
  Target,
  HeartPulse,
  BarChart3,
  HelpCircle,
  LucideProps,
} from "lucide-react";

interface ModuleIconProps extends LucideProps {
  name: string;
}

const ICON_MAP: Record<string, React.ComponentType<LucideProps>> = {
  Compass,
  CheckSquare,
  Activity,
  Code2,
  Layers,
  Languages,
  Briefcase,
  Wallet,
  Utensils,
  MapPin,
  Image: ImageIcon,
  BookOpen,
  FileText,
  Target,
  HeartPulse,
  BarChart3,
};

export function ModuleIcon({ name, ...props }: ModuleIconProps) {
  const IconComponent = ICON_MAP[name] || HelpCircle;
  return <IconComponent {...props} />;
}
