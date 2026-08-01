import { z } from "zod";
import { invoiceItemSchema } from "./invoice-schemas";

export const purchaseInvoiceSchema = z.object({
  purchaseInvoiceNumber: z.string().min(1, "Purchase Invoice number is required"),
  supplierInvoiceNo: z.string().min(1, "Supplier bill/invoice number is required"),
  date: z.string().min(1, "Date is required"),
  supplierName: z.string().min(1, "Supplier name is required"),
  supplierGstin: z.string().optional(),
  supplierAddress: z.string().min(1, "Supplier address is required"),
  supplierState: z.string().min(1, "Supplier state is required"),
  items: z.array(invoiceItemSchema).min(1, "At least one purchase item is required"),
  itcEligibility: z
    .enum(["Inputs", "Capital Goods", "Input Services", "Ineligible"])
    .default("Inputs"),
  status: z.enum(["Draft", "Completed", "Cancelled"]).default("Completed"),
});
