import { z } from "zod";

export const itemMasterSchema = z.object({
  name: z.string().min(1, "Item name is required"),
  type: z.enum(["Product", "Service"]),
  sku: z.string().optional(),
  barcode: z.string().optional(),
  hsnCode: z.string().optional(),
  sacCode: z.string().optional(),
  stock: z.number().default(0),
  minStock: z.number().min(0, "Min stock must be 0 or positive").default(0),
  reorderQty: z.number().min(0).default(0),
  category: z.string().optional(),
  brand: z.string().optional(),
  unit: z.string().min(1, "Unit is required"),
  sellingRate: z.number().min(0, "Selling rate must be 0 or positive"),
  purchaseRate: z.number().min(0).optional().default(0),
  taxRate: z.number().default(18),
  taxType: z.enum(["Inclusive", "Exclusive"]).default("Exclusive"),
  location: z.string().optional(),
  narration: z.string().optional(),
});

export const stockAdjustmentSchema = z.object({
  date: z.string().min(1, "Date is required"),
  type: z.enum(["Stock In", "Stock Out"]),
  reason: z.enum([
    "Physical Count Variance",
    "Damaged Goods",
    "Expired Stock",
    "Opening Stock Setup",
    "Sample Distribution",
    "Other",
  ]),
  godown: z.string().optional(),
  items: z
    .array(
      z.object({
        itemId: z.string().min(1, "Item selection is required"),
        name: z.string().min(1, "Item name is required"),
        qty: z.number().gt(0, "Quantity must be greater than 0"),
        unit: z.string().min(1),
        rate: z.number().min(0).optional(),
        batch: z.string().optional(),
        reasonDetails: z.string().optional(),
      })
    )
    .min(1, "At least one item is required for adjustment"),
  narration: z.string().optional(),
});

export const stockTransferSchema = z.object({
  date: z.string().min(1, "Date is required"),
  sourceGodown: z.string().min(1, "Source godown is required"),
  destinationGodown: z.string().min(1, "Destination godown is required"),
  items: z
    .array(
      z.object({
        itemId: z.string().min(1, "Item selection is required"),
        name: z.string().min(1, "Item name is required"),
        qty: z.number().gt(0, "Quantity must be greater than 0"),
        unit: z.string().min(1),
        batch: z.string().optional(),
      })
    )
    .min(1, "At least one item is required for transfer"),
  narration: z.string().optional(),
});
