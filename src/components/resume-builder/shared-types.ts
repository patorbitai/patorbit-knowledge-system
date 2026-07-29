"use client";

import type { ReactNode } from "react";

export interface AIActionButtonProps {
  label: string;
  onClick: () => void;
  isLoading?: boolean;
  variant?: "primary" | "secondary" | "ghost" | "outline";
  size?: "sm" | "md";
  icon?: ReactNode;
  disabled?: boolean;
  className?: string;
}

export interface SmartSuggestionProps {
  original: string;
  suggestion: string;
  onAccept: () => void;
  onRegenerate: () => void;
  onDismiss: () => void;
  isLoading?: boolean;
  type?: "improvement" | "rewrite" | "ats" | "grammar" | "impact" | "metric";
}

export interface SectionCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  children: ReactNode;
  isValid?: boolean;
  isActive?: boolean;
  actions?: ReactNode;
  className?: string;
}

export interface AnalysisScoreProps {
  label: string;
  score: number;
  maxScore?: number;
  color?: string;
  size?: "sm" | "md" | "lg";
  showAnimation?: boolean;
  tooltip?: string;
}

export interface SectionFieldProps {
  label: string;
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  error?: string;
  type?: "text" | "textarea" | "email" | "tel" | "url";
  icon?: ReactNode;
  aiActions?: ReactNode;
  rows?: number;
}
