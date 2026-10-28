"use client";

import { useEffect, useRef } from "react";

/**
 * Hook to safely attach DOM event listeners with automatic lifecycle cleanup
 * to prevent memory leaks.
 */
export function useEventListener<K extends keyof WindowEventMap>(
  eventName: K,
  handler: (event: WindowEventMap[K]) => void,
  element?: Window | HTMLElement | null,
  options?: boolean | AddEventListenerOptions
): void;

export function useEventListener<K extends keyof DocumentEventMap>(
  eventName: K,
  handler: (event: DocumentEventMap[K]) => void,
  element: Document,
  options?: boolean | AddEventListenerOptions
): void;

export function useEventListener(
  eventName: string,
  handler: (event: any) => void,
  element?: EventTarget | null,
  options?: boolean | AddEventListenerOptions
) {
  // Keep saved reference to handler to avoid re-attaching when handler closure changes
  const savedHandler = useRef(handler);

  useEffect(() => {
    savedHandler.current = handler;
  }, [handler]);

  useEffect(() => {
    const targetElement = element !== undefined ? element : typeof window !== "undefined" ? window : null;
    if (!targetElement || !targetElement.addEventListener) return;

    const eventListener = (event: Event) => savedHandler.current(event);

    targetElement.addEventListener(eventName, eventListener, options);

    return () => {
      targetElement.removeEventListener(eventName, eventListener, options);
    };
  }, [eventName, element, options]);
}

export default useEventListener;

