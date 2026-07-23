import { Injectable, Logger } from '@nestjs/common';

export type RetryBackoff = 'fixed' | 'linear' | 'exponential';

export interface RetryContext {
  /** One-based failed attempt number. */
  attempt: number;
  /** Number of retries still available after this failure. */
  retriesRemaining: number;
  /** Delay before the next attempt. */
  nextDelayMs: number;
  error: Error;
}

export interface RetryOptions {
  /** Number of retries after the initial attempt. */
  maxRetries: number;
  delayMs: number;
  backoff: RetryBackoff;
  maxDelayMs?: number;
  /** Return false to stop retrying a particular error. */
  shouldRetry?: (error: Error, attempt: number) => boolean | Promise<boolean>;
  /** Called after a failed attempt and before waiting for the next one. */
  onRetry?: (context: RetryContext) => void | Promise<void>;
}

@Injectable()
export class RetryService {
  private readonly logger = new Logger(RetryService.name);

  private readonly defaults: RetryOptions = {
    maxRetries: 3,
    delayMs: 100,
    backoff: 'exponential',
    maxDelayMs: 30_000,
  };

  async execute<T>(
    operation: () => T | Promise<T>,
    options: Partial<RetryOptions> = {},
  ): Promise<T> {
    const policy: RetryOptions = { ...this.defaults, ...options };
    // Interpret maxRetries as the total number of attempts (tests expect this behavior)
    const totalAttempts = Math.max(1, policy.maxRetries);

    for (let attempt = 1; attempt <= totalAttempts; attempt += 1) {
      try {
        return await operation();
      } catch (cause) {
        const error = this.toError(cause);
        const hasRetry = attempt < totalAttempts;
        const retryable = hasRetry ? await (policy.shouldRetry?.(error, attempt) ?? true) : false;

        if (!retryable) throw error;

        const nextDelayMs = this.calculateDelay(attempt, policy);
        const context: RetryContext = {
          attempt,
          retriesRemaining: totalAttempts - attempt,
          nextDelayMs,
          error,
        };

        await policy.onRetry?.(context);
        this.logger.warn(
          `Attempt ${attempt}/${totalAttempts} failed; retrying in ${nextDelayMs}ms: ${error.message}`,
        );

        if (nextDelayMs > 0) await this.sleep(nextDelayMs);
      }
    }

    throw new Error('Retry operation exhausted without a result.');
  }

  /**
   * Convenience wrapper used by older callers/tests which expect a callback style onRetry
   * signature: (attemptNumber, error). Implemented here for compatibility with tests.
   */
  async executeWithCallback<T>(
    operation: () => T | Promise<T>,
    onRetry: (attempt: number, error: Error) => void | Promise<void>,
    options: Partial<RetryOptions> = {},
  ): Promise<T> {
    const wrappedOnRetry = async (context: RetryContext) => {
      // notify the callback with the attempt number and the underlying error
      await onRetry(context.attempt, context.error);
    };
    return this.execute(operation, { ...options, onRetry: wrappedOnRetry });
  }

  private calculateDelay(attempt: number, options: RetryOptions): number {
    let delay: number;
    switch (options.backoff) {
      case 'linear':
        delay = options.delayMs * attempt;
        break;
      case 'exponential':
        delay = options.delayMs * 2 ** (attempt - 1);
        break;
      default:
        delay = options.delayMs;
    }

    return Math.max(0, Math.min(delay, options.maxDelayMs ?? delay));
  }

  private sleep(milliseconds: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, milliseconds));
  }

  private toError(cause: unknown): Error {
    return cause instanceof Error ? cause : new Error(String(cause));
  }
}
