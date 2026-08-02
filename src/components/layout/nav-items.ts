import {
  FileText,
  ShoppingBag,
  Package,
  Sliders,
  ArrowLeftRight,
  TrendingDown,
  TrendingUp,
  LayoutDashboard,
  Receipt,
  Settings,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
}

export interface NavGroup {
  /** Section heading, or null for items that stand alone (e.g. Settings). */
  title: string | null;
  items: NavItem[];
}

/**
 * Grouped so each document type sits next to the ledger it affects: credit
 * notes belong with sales, debit notes with purchases.
 */
export const NAV_GROUPS: NavGroup[] = [
  {
    title: "Overview",
    items: [
      { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
      { label: "Transactions", href: "/transactions", icon: Receipt },
    ],
  },
  {
    title: "Sales",
    items: [
      { label: "Sales Invoices", href: "/sales", icon: FileText },
      { label: "Credit Notes", href: "/credit-notes", icon: TrendingDown },
    ],
  },
  {
    title: "Purchases",
    items: [
      { label: "Purchase Bills", href: "/purchases", icon: ShoppingBag },
      { label: "Debit Notes", href: "/debit-notes", icon: TrendingUp },
    ],
  },
  {
    title: "Inventory",
    items: [
      { label: "Inventory Master", href: "/inventory", icon: Package },
      { label: "Stock Adjustments", href: "/inventory/adjustments", icon: Sliders },
      { label: "Godown Transfers", href: "/inventory/transfers", icon: ArrowLeftRight },
    ],
  },
  {
    title: null,
    items: [{ label: "Settings", href: "/settings", icon: Settings }],
  },
];

const ALL_HREFS = NAV_GROUPS.flatMap((group) => group.items.map((item) => item.href));

/**
 * The single nav href that should render as active for a pathname.
 *
 * A plain `pathname.startsWith(href)` lights up every ancestor, so
 * `/inventory/adjustments` would highlight both "Inventory Master" and "Stock
 * Adjustments". Taking the longest match keeps exactly one item active, and
 * still highlights the parent for detail routes like `/sales/<id>`.
 */
export function resolveActiveHref(pathname: string): string | undefined {
  return ALL_HREFS.filter(
    (href) => pathname === href || pathname.startsWith(`${href}/`)
  ).sort((a, b) => b.length - a.length)[0];
}
