"use client";

import { X } from "lucide-react";
import { SHORTCUT_SECTIONS } from "@/lib/keyboard/shortcuts";
import { useDialogA11y } from "@/hooks/useDialogA11y";

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export function ShortcutsHelp({ isOpen, onClose }: Props) {
  const dialogRef = useDialogA11y({ isOpen, onClose });

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-100 bg-black/40 flex items-center justify-center p-4"
      onMouseDown={onClose}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="shortcuts-title"
        className="w-full max-w-2xl max-h-[85vh] overflow-y-auto bg-white rounded-2xl shadow-2xl border border-slate-200"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 sticky top-0 bg-white">
          <h2 id="shortcuts-title" className="text-lg font-bold text-[#0b2641]">
            Keyboard Shortcuts
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close shortcuts"
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-6">
          {SHORTCUT_SECTIONS.map((section) => (
            <section key={section.title}>
              <h3 className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400 mb-2.5">
                {section.title}
              </h3>
              <dl className="space-y-1.5">
                {section.shortcuts.map((shortcut) => (
                  <div
                    key={shortcut.description}
                    className="flex items-center justify-between gap-4 text-sm"
                  >
                    <dt className="text-slate-600">{shortcut.description}</dt>
                    <dd className="flex items-center gap-1 shrink-0">
                      {shortcut.keys.map((key) => (
                        <kbd
                          key={key}
                          className="min-w-[22px] text-center font-mono text-[11px] text-slate-600 bg-slate-100 border border-slate-300 border-b-2 rounded px-1.5 py-0.5"
                        >
                          {key}
                        </kbd>
                      ))}
                    </dd>
                  </div>
                ))}
              </dl>
            </section>
          ))}
        </div>

        <p className="px-6 pb-5 text-xs text-slate-400">
          Sequences like <kbd className="font-mono">g</kbd> <kbd className="font-mono">s</kbd> are
          pressed one after the other, not together.
        </p>
      </div>
    </div>
  );
}
