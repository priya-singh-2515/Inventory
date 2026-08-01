export type TransactionType =
  | "Sales Invoice"
  | "Purchase Invoice"
  | "Stock In Adjustment"
  | "Stock Out Adjustment"
  | "Godown Transfer In"
  | "Godown Transfer Out"
  | "Credit Note"
  | "Debit Note";

export interface StockLedgerEntry {
  _id?: string;
  date: string;
  itemId: string;
  itemName: string;
  transactionType: TransactionType;
  referenceId: string;
  godown?: string;
  batch?: string;
  qtyIn: number;
  qtyOut: number;
  balanceStock: number;
  rate?: number;
  narration?: string;
  createdAt?: string;
}

export type StockAdjustmentReason =
  | "Physical Count Variance"
  | "Damaged Goods"
  | "Expired Stock"
  | "Opening Stock Setup"
  | "Sample Distribution"
  | "Other";

export interface StockAdjustmentItem {
  itemId: string;
  name: string;
  qty: number;
  unit: string;
  rate?: number;
  batch?: string;
  reasonDetails?: string;
}

export interface StockAdjustment {
  _id?: string;
  adjustmentNo: string;
  date: string;
  type: "Stock In" | "Stock Out";
  reason: StockAdjustmentReason;
  godown?: string;
  items: StockAdjustmentItem[];
  narration?: string;
  status: "Completed" | "Cancelled";
  createdAt?: string;
}

export interface StockTransferItem {
  itemId: string;
  name: string;
  qty: number;
  unit: string;
  batch?: string;
}

export interface StockTransfer {
  _id?: string;
  transferNo: string;
  date: string;
  sourceGodown: string;
  destinationGodown: string;
  items: StockTransferItem[];
  narration?: string;
  status: "Completed" | "Cancelled";
  createdAt?: string;
}

export interface ItemMaster {
  _id?: string;
  name: string;
  type: "Product" | "Service";
  sku?: string;
  barcode?: string;
  hsnCode?: string;
  sacCode?: string;
  stock: number;
  minStock: number;
  reorderQty: number;
  category?: string;
  brand?: string;
  group?: string;
  unit: string;
  qty?: number;
  rate?: number;
  sellingRate: number;
  purchaseRate?: number;
  discountPercent?: number;
  taxRate: number;
  taxRateType: "GST" | "Not Applicable";
  taxType: "Inclusive" | "Exclusive";
  location?: string;
  narration?: string;
  isLowStock?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface StockValuationSummary {
  totalItemsCount: number;
  lowStockItemsCount: number;
  totalStockQuantity: number;
  totalValueAtCost: number;
  totalValueAtSelling: number;
}
