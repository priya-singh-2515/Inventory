/**
 * Single source of truth for keyboard shortcuts.
 *
 * The help overlay renders straight from these definitions, so a shortcut can
 * never be implemented without also being documented.
 */

export interface ShortcutDefinition {
  /** Rendered keycaps, e.g. ["g", "s"] or ["⌘", "K"]. */
  keys: string[];
  description: string;
}

export interface ShortcutSection {
  title: string;
  shortcuts: ShortcutDefinition[];
}

/** `g` followed by this key navigates to the route. */
export const GOTO_BINDINGS: Record<string, { href: string; label: string }> = {
  d: { href: "/dashboard", label: "Dashboard" },
  t: { href: "/transactions", label: "Transactions" },
  s: { href: "/sales", label: "Sales Invoices" },
  c: { href: "/credit-notes", label: "Credit Notes" },
  p: { href: "/purchases", label: "Purchase Bills" },
  b: { href: "/debit-notes", label: "Debit Notes" },
  i: { href: "/inventory", label: "Inventory Master" },
  a: { href: "/inventory/adjustments", label: "Stock Adjustments" },
  g: { href: "/inventory/transfers", label: "Godown Transfers" },
  ",": { href: "/settings", label: "Settings" },
};

export const SHORTCUT_SECTIONS: ShortcutSection[] = [
  {
    title: "General",
    shortcuts: [
      { keys: ["⌘/Ctrl", "K"], description: "Open the command palette" },
      { keys: ["?"], description: "Show this shortcut list" },
      { keys: ["Esc"], description: "Close a dialog, menu, or overlay" },
      { keys: ["/"], description: "Focus the search box on a list page" },
    ],
  },
  {
    title: "Create",
    shortcuts: [
      { keys: ["n", "s"], description: "New sales invoice" },
      { keys: ["n", "p"], description: "New purchase bill" },
      { keys: ["n", "i"], description: "New inventory item" },
    ],
  },
  {
    title: "Go to",
    shortcuts: Object.entries(GOTO_BINDINGS).map(([key, target]) => ({
      keys: ["g", key],
      description: target.label,
    })),
  },
  {
    title: "Lists & tables",
    shortcuts: [
      { keys: ["↑", "↓"], description: "Move between rows" },
      { keys: ["Enter"], description: "Open the highlighted row" },
      { keys: ["Home", "End"], description: "Jump to the first or last row" },
    ],
  },
  {
    title: "Dialogs",
    shortcuts: [
      { keys: ["Tab"], description: "Cycle fields — focus stays inside the dialog" },
      { keys: ["⌘/Ctrl", "Enter"], description: "Submit the open form" },
    ],
  },
];

/** `n` followed by this key opens the create screen. */
export const NEW_BINDINGS: Record<string, { href: string; label: string }> = {
  s: { href: "/sales/new", label: "New sales invoice" },
  p: { href: "/purchases/new", label: "New purchase bill" },
  i: { href: "/inventory?new=1", label: "New inventory item" },
};

/**
 * Whether a keystroke landed in something the user is typing into. Single-key
 * shortcuts must stand down in that case, or typing "n" in a name field would
 * navigate away.
 */
export function isEditableTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  const tag = target.tagName;
  return (
    tag === "INPUT" ||
    tag === "TEXTAREA" ||
    tag === "SELECT" ||
    target.isContentEditable ||
    target.getAttribute("role") === "textbox"
  );
}
