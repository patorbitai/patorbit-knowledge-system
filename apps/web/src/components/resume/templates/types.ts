'use client';

import { type ReactNode } from 'react';

/** Types shared across all resume templates */
export interface ResumeData {
  title: string;
  sections: Array<{
    id: string;
    type: string;
    title: string | null;
    content: Record<string, unknown> | null;
    isVisible: boolean;
  }>;
}

export type SectionRenderer = React.ComponentType<{
  content: Record<string, unknown>;
}>;

/** Safe accessor helpers for template use */
export function str(value: unknown): string {
  return typeof value === 'string' ? value : '';
}

export function node(value: unknown): ReactNode {
  return typeof value === 'string' ? value : null;
}

export function arr<T = unknown>(value: unknown): T[] {
  return Array.isArray(value) ? (value as T[]) : [];
}
