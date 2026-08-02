"use client";

import { useEffect, useRef } from "react";

const FOCUSABLE = [
  "a[href]",
  "button:not([disabled])",
  "input:not([disabled]):not([type='hidden'])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  "[tabindex]:not([tabindex='-1'])",
].join(",");

interface Options {
  isOpen: boolean;
  onClose: () => void;
  /** Cmd/Ctrl+Enter submits without reaching for the mouse. */
  onSubmit?: () => void;
}

/**
 * Makes a dialog usable without a mouse:
 *
 * - Escape closes it
 * - Tab and Shift+Tab cycle inside it instead of escaping to the page behind
 * - the first field is focused on open
 * - focus returns to whatever opened it on close
 * - Cmd/Ctrl+Enter submits
 *
 * Returns a ref to attach to the dialog container.
 */
export function useDialogA11y({ isOpen, onClose, onSubmit }: Options) {
  const containerRef = useRef<HTMLDivElement>(null);
  const restoreFocusRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    restoreFocusRef.current = document.activeElement as HTMLElement | null;

    // Focus the first real field, skipping the close button if there is one.
    const container = containerRef.current;
    const focusables = container?.querySelectorAll<HTMLElement>(FOCUSABLE);
    const firstField = container?.querySelector<HTMLElement>(
      "input:not([type='hidden']):not([disabled]), select:not([disabled]), textarea:not([disabled])"
    );
    (firstField ?? focusables?.[0])?.focus();

    // The page behind must not scroll while a dialog is up.
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.stopPropagation();
        onClose();
        return;
      }

      if (onSubmit && event.key === "Enter" && (event.metaKey || event.ctrlKey)) {
        event.preventDefault();
        onSubmit();
        return;
      }

      if (event.key !== "Tab") return;

      const nodes = containerRef.current?.querySelectorAll<HTMLElement>(FOCUSABLE);
      if (!nodes || nodes.length === 0) return;

      const first = nodes[0];
      const last = nodes[nodes.length - 1];
      const active = document.activeElement;

      // Wrap at both ends so focus never lands behind the overlay.
      if (event.shiftKey && (active === first || !containerRef.current?.contains(active))) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && active === last) {
        event.preventDefault();
        first.focus();
      }
    }

    document.addEventListener("keydown", handleKeyDown, true);
    return () => {
      document.removeEventListener("keydown", handleKeyDown, true);
      document.body.style.overflow = previousOverflow;
      restoreFocusRef.current?.focus();
    };
  }, [isOpen, onClose, onSubmit]);

  return containerRef;
}
