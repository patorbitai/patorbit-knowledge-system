'use client';

import { Wand2 } from 'lucide-react';

import { cn } from '@/lib/utils';

export function AIActionButton({
  onClick,
  disabled,
  isLoading,
  className,
}: {
  onClick: () => void;
  disabled?: boolean;
  isLoading?: boolean;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled || isLoading}
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium transition-colors',
        'border border-purple-200 bg-purple-50 text-purple-600 hover:bg-purple-100',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        isLoading && 'animate-pulse',
        className,
      )}
    >
      <Wand2 className="h-3 w-3" />
      <span>{isLoading ? 'Thinking...' : 'Improve with AI'}</span>
    </button>
  );
}
