"use client";

import { useState, useRef, useCallback } from "react";

export interface IdempotentActionOptions {
  onSuccess?: (result: any) => void;
  onError?: (error: Error) => void;
}

/**
 * Hook to guard asynchronous actions against double-clicks and concurrent submissions.
 * Generates and preserves a UUID idempotency key for the active transaction.
 */
export function useIdempotentAction<TArgs extends any[], TResult>(
  action: (idempotencyKey: string, ...args: TArgs) => Promise<TResult>,
  options?: IdempotentActionOptions
) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // Generate deterministic UUID for active transaction
  const idempotencyKeyRef = useRef<string>(generateUUID());
  const inFlightRef = useRef(false);

  const resetKey = useCallback(() => {
    idempotencyKeyRef.current = generateUUID();
    setError(null);
  }, []);

  const execute = useCallback(
    async (...args: TArgs): Promise<TResult | undefined> => {
      // Guard: If an execution is already in flight, block concurrent clicks
      if (inFlightRef.current) {
        console.warn("[useIdempotentAction] Duplicate submit blocked: action already in flight.");
        return undefined;
      }

      inFlightRef.current = true;
      setIsSubmitting(true);
      setError(null);

      try {
        const result = await action(idempotencyKeyRef.current, ...args);
        // Upon successful execution, generate a fresh key for subsequent distinct actions
        idempotencyKeyRef.current = generateUUID();
        options?.onSuccess?.(result);
        return result;
      } catch (err: any) {
        const errorObj = err instanceof Error ? err : new Error(err?.message || "An error occurred");
        setError(errorObj);
        options?.onError?.(errorObj);
        throw errorObj;
      } finally {
        inFlightRef.current = false;
        setIsSubmitting(false);
      }
    },
    [action, options]
  );

  return {
    execute,
    isSubmitting,
    error,
    idempotencyKey: idempotencyKeyRef.current,
    reset: resetKey,
  };
}

function generateUUID(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  // Fallback for environments where crypto.randomUUID is not available
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export default useIdempotentAction;

