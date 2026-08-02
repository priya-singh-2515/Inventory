"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { CommandPalette } from "@/components/keyboard/CommandPalette";
import { ShortcutsHelp } from "@/components/keyboard/ShortcutsHelp";
import { GOTO_BINDINGS, NEW_BINDINGS, isEditableTarget } from "@/lib/keyboard/shortcuts";

/** How long a `g` or `n` prefix stays armed before it is forgotten. */
const SEQUENCE_TIMEOUT_MS = 1200;

/**
 * Owns the app-wide key handling: command palette, shortcut help, `g`/`n`
 * sequences, and `/` to focus a page's search box.
 */
export function KeyboardProvider() {
  const router = useRouter();
  const [isPaletteOpen, setPaletteOpen] = useState(false);
  const [isHelpOpen, setHelpOpen] = useState(false);
  const pendingPrefix = useRef<"g" | "n" | null>(null);
  const prefixTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearPrefix = useCallback(() => {
    pendingPrefix.current = null;
    if (prefixTimer.current) clearTimeout(prefixTimer.current);
  }, []);

  const armPrefix = useCallback(
    (prefix: "g" | "n") => {
      pendingPrefix.current = prefix;
      if (prefixTimer.current) clearTimeout(prefixTimer.current);
      prefixTimer.current = setTimeout(() => {
        pendingPrefix.current = null;
      }, SEQUENCE_TIMEOUT_MS);
    },
    []
  );

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      const isModified = event.metaKey || event.ctrlKey || event.altKey;

      // Cmd/Ctrl+K works everywhere, including from inside a text field.
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setHelpOpen(false);
        setPaletteOpen((open) => !open);
        return;
      }

      // Escape closes whichever overlay this provider owns.
      if (event.key === "Escape") {
        setPaletteOpen(false);
        setHelpOpen(false);
        clearPrefix();
        return;
      }

      // Every remaining shortcut is a bare key, so stand down while typing.
      if (isModified || isEditableTarget(event.target) || isPaletteOpen || isHelpOpen) return;

      // Resolve a pending `g` / `n` sequence first.
      const prefix = pendingPrefix.current;
      if (prefix) {
        const table = prefix === "g" ? GOTO_BINDINGS : NEW_BINDINGS;
        const target = table[event.key.toLowerCase()];
        clearPrefix();
        if (target) {
          event.preventDefault();
          router.push(target.href);
        }
        return;
      }

      const key = event.key;

      if (key === "?") {
        event.preventDefault();
        setHelpOpen(true);
        return;
      }

      if (key === "/") {
        // Hand focus to the page's own search box, wherever it is.
        const search = document.querySelector<HTMLInputElement>('input[data-search="true"]');
        if (search) {
          event.preventDefault();
          search.focus();
          search.select();
        }
        return;
      }

      if (key === "g" || key === "n") {
        event.preventDefault();
        armPrefix(key);
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      if (prefixTimer.current) clearTimeout(prefixTimer.current);
    };
  }, [router, isPaletteOpen, isHelpOpen, armPrefix, clearPrefix]);

  return (
    <>
      <CommandPalette isOpen={isPaletteOpen} onClose={() => setPaletteOpen(false)} />
      <ShortcutsHelp isOpen={isHelpOpen} onClose={() => setHelpOpen(false)} />
    </>
  );
}
