'use client';

import { Check, Copy, RefreshCw, X } from 'lucide-react';
import { type ReactNode, useState } from 'react';

import { cn } from '@/lib/utils';

interface AIActionModalProps {
  isOpen: boolean;
  onClose: () => void;
  originalText: string;
  suggestion: ReactNode;
  onAccept: () => void;
  onRegenerate: () => void;
  isLoading: boolean;
}

export function AIActionModal({
  isOpen,
  onClose,
  originalText,
  suggestion,
  onAccept,
  onRegenerate,
  isLoading,
}: AIActionModalProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(suggestion as string);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-2xl rounded-xl bg-white p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-gray-400 hover:text-gray-600"
        >
          <X className="h-5 w-5" />
        </button>

        <h3 className="text-lg font-semibold text-gray-800 mb-4">AI Suggestion</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h4 className="text-sm font-medium text-gray-500 mb-2">Original</h4>
            <div className="rounded-md border bg-gray-50 p-3 text-sm text-gray-700 h-48 overflow-y-auto">
              {originalText}
            </div>
          </div>
          <div>
            <h4 className="text-sm font-medium text-gray-500 mb-2">Suggestion</h4>
            <div
              className={cn(
                'relative rounded-md border border-purple-200 bg-purple-50 p-3 text-sm text-gray-800 h-48 overflow-y-auto',
                isLoading && 'animate-pulse',
              )}
            >
              {isLoading ? 'Generating...' : suggestion}
              {!isLoading && (
                <button
                  onClick={handleCopy}
                  className="absolute top-2 right-2 text-gray-400 hover:text-gray-600"
                >
                  {copied ? (
                    <Check className="h-4 w-4 text-green-500" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="mt-6 flex justify-end items-center gap-2">
          <button
            onClick={onRegenerate}
            disabled={isLoading}
            className="flex items-center gap-1.5 text-sm text-gray-600 hover:text-gray-900 disabled:opacity-50"
          >
            <RefreshCw className={`h-3 w-3 ${isLoading ? 'animate-spin' : ''}`} />
            Regenerate
          </button>
          <button
            onClick={onAccept}
            disabled={isLoading}
            className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-sm hover:bg-primary/90 disabled:opacity-50"
          >
            Accept Suggestion
          </button>
        </div>
      </div>
    </div>
  );
}
