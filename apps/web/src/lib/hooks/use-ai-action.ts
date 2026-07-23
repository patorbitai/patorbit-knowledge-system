// apps/web/src/lib/hooks/use-ai-action.ts
import { useState } from 'react';
import { toast } from 'sonner';

type AiAction<T, R> = (params: T) => Promise<R>;

export function useAiAction<T, R>(
  action: AiAction<T, R>,
  options?: {
    onSuccess?: (data: R) => void;
    onError?: (error: Error) => void;
  },
) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const execute = async (params: T) => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await action(params);
      options?.onSuccess?.(result);
      toast.success('AI suggestion applied!');
      return result;
    } catch (err) {
      setError(err as Error);
      options?.onError?.(err as Error);
      toast.error('AI action failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return { execute, isLoading, error };
}
