"use client";

import { useCallback, useEffect, useState } from "react";
import { isEditableTarget } from "@/lib/keyboard/shortcuts";

interface Options {
  /** Number of rows currently rendered. */
  count: number;
  /** Called with the row index when Enter is pressed. */
  onActivate?: (index: number) => void;
  /** Disable while a dialog is open so the two do not fight over arrow keys. */
  enabled?: boolean;
}

/**
 * Arrow-key navigation for a table or list.
 *
 * Up/Down move the highlight, Home/End jump to the ends, Enter opens the
 * highlighted row. Ignored while the user is typing in a field, so `/`-to-search
 * still behaves normally.
 */
export function useListKeyboardNav({ count, onActivate, enabled = true }: Options) {
  const [activeIndex, setActiveIndex] = useState(-1);

  // Keep the highlight in range when the list is filtered down.
  useEffect(() => {
    setActiveIndex((current) => (current >= count ? count - 1 : current));
  }, [count]);

  useEffect(() => {
    if (!enabled || count === 0) return;

    function handleKeyDown(event: KeyboardEvent) {
      if (isEditableTarget(event.target)) return;

      switch (event.key) {
        case "ArrowDown":
          event.preventDefault();
          setActiveIndex((current) => (current + 1) % count);
          break;
        case "ArrowUp":
          event.preventDefault();
          setActiveIndex((current) => (current <= 0 ? count - 1 : current - 1));
          break;
        case "Home":
          event.preventDefault();
          setActiveIndex(0);
          break;
        case "End":
          event.preventDefault();
          setActiveIndex(count - 1);
          break;
        case "Enter":
          if (activeIndex >= 0 && onActivate) {
            event.preventDefault();
            onActivate(activeIndex);
          }
          break;
        default:
          break;
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [count, activeIndex, onActivate, enabled]);

  // Keep the highlighted row on screen.
  useEffect(() => {
    if (activeIndex < 0) return;
    document
      .querySelector(`[data-row-index="${activeIndex}"]`)
      ?.scrollIntoView({ block: "nearest" });
  }, [activeIndex]);

  const rowProps = useCallback(
    (index: number) => ({
      "data-row-index": index,
      "aria-selected": index === activeIndex,
      className: index === activeIndex ? "bg-blue-50 ring-1 ring-inset ring-blue-300" : "",
    }),
    [activeIndex]
  );

  return { activeIndex, setActiveIndex, rowProps };
}
