"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Search, CornerDownLeft } from "lucide-react";
import { NAV_GROUPS } from "@/components/layout/nav-items";
import { NEW_BINDINGS } from "@/lib/keyboard/shortcuts";

export interface Command {
  id: string;
  label: string;
  group: string;
  href: string;
  keywords?: string;
}

const COMMANDS: Command[] = [
  ...Object.values(NEW_BINDINGS).map((entry) => ({
    id: `new:${entry.href}`,
    label: entry.label,
    group: "Create",
    href: entry.href,
    keywords: "add create new",
  })),
  ...NAV_GROUPS.flatMap((group) =>
    group.items.map((item) => ({
      id: `nav:${item.href}`,
      label: item.label,
      group: group.title ?? "General",
      href: item.href,
    }))
  ),
];

/** Subsequence match, so "sinv" finds "Sales Invoices". */
function matches(command: Command, query: string): boolean {
  if (!query) return true;
  const haystack = `${command.label} ${command.group} ${command.keywords ?? ""}`.toLowerCase();
  const needle = query.toLowerCase().replace(/\s+/g, "");

  let position = 0;
  for (const character of needle) {
    position = haystack.indexOf(character, position);
    if (position === -1) return false;
    position += 1;
  }
  return true;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export function CommandPalette({ isOpen, onClose }: Props) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  const results = useMemo(() => COMMANDS.filter((c) => matches(c, query)), [query]);

  useEffect(() => {
    if (isOpen) {
      setQuery("");
      setActiveIndex(0);
      // Focus after paint so the input exists.
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  }, [isOpen]);

  useEffect(() => setActiveIndex(0), [query]);

  useEffect(() => {
    listRef.current
      ?.querySelector(`[data-index="${activeIndex}"]`)
      ?.scrollIntoView({ block: "nearest" });
  }, [activeIndex]);

  if (!isOpen) return null;

  function runCommand(command: Command | undefined) {
    if (!command) return;
    onClose();
    router.push(command.href);
  }

  function handleKeyDown(event: React.KeyboardEvent) {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveIndex((current) => (results.length ? (current + 1) % results.length : 0));
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex((current) =>
        results.length ? (current <= 0 ? results.length - 1 : current - 1) : 0
      );
    } else if (event.key === "Enter") {
      event.preventDefault();
      runCommand(results[activeIndex]);
    } else if (event.key === "Escape") {
      event.preventDefault();
      onClose();
    }
  }

  return (
    <div
      className="fixed inset-0 z-100 bg-black/40 flex items-start justify-center pt-[12vh] px-4"
      onMouseDown={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Command palette"
        className="w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden"
        onMouseDown={(event) => event.stopPropagation()}
        onKeyDown={handleKeyDown}
      >
        <div className="flex items-center gap-3 px-4 border-b border-slate-200">
          <Search className="w-4 h-4 text-slate-400 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search pages and actions..."
            aria-label="Search pages and actions"
            aria-controls="command-results"
            aria-activedescendant={results[activeIndex] ? `command-${results[activeIndex].id}` : undefined}
            className="flex-1 py-3.5 text-sm bg-transparent outline-hidden placeholder:text-slate-400"
          />
          <kbd className="text-[10px] font-mono text-slate-400 border border-slate-200 rounded px-1.5 py-0.5">
            Esc
          </kbd>
        </div>

        <ul
          ref={listRef}
          id="command-results"
          role="listbox"
          aria-label="Results"
          className="max-h-72 overflow-y-auto py-2"
        >
          {results.length === 0 && (
            <li className="px-4 py-6 text-center text-sm text-slate-400">
              Nothing matches “{query}”
            </li>
          )}
          {results.map((command, index) => (
            <li key={command.id}>
              <button
                type="button"
                id={`command-${command.id}`}
                data-index={index}
                role="option"
                aria-selected={index === activeIndex}
                onMouseEnter={() => setActiveIndex(index)}
                onClick={() => runCommand(command)}
                className={`w-full flex items-center justify-between gap-3 px-4 py-2.5 text-left text-sm transition-colors ${
                  index === activeIndex ? "bg-[#0b2641] text-white" : "text-slate-700 hover:bg-slate-50"
                }`}
              >
                <span className="font-medium">{command.label}</span>
                <span className="flex items-center gap-2">
                  <span
                    className={`text-[11px] ${
                      index === activeIndex ? "text-blue-200" : "text-slate-400"
                    }`}
                  >
                    {command.group}
                  </span>
                  {index === activeIndex && <CornerDownLeft className="w-3.5 h-3.5" />}
                </span>
              </button>
            </li>
          ))}
        </ul>

        <div className="px-4 py-2 border-t border-slate-200 bg-slate-50 text-[11px] text-slate-500 flex items-center gap-4">
          <span>↑↓ navigate</span>
          <span>↵ open</span>
          <span className="ml-auto">? for all shortcuts</span>
        </div>
      </div>
    </div>
  );
}
