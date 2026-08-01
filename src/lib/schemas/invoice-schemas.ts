import { z } from "zod";
import { GSTIN_REGEX, PINCODE_REGEX } from "@/common/regex";
import { VALID_GST_RATES } from "@/lib/constants";

export const partySchema = z.object({
  name: z.string().min(1, "Party name is required"),
  gstin: z
    .string()
    .regex(GSTIN_REGEX, "Invalid 15-character GSTIN format")
    .optional()
    .or(z.literal("")),
  address: z.string().min(1, "Address is required"),
  state: z.string().min(1, "State is required"),
  city: z.string().optional(),
  pincode: z
    .string()
    .regex(PINCODE_REGEX, "Pincode must be 6 digits")
    .optional()
    .or(z.literal("")),
  partyType: z.enum(["Customer", "Supplier"]),
  phone: z.string().optional(),
  email: z.string().email("Invalid email").optional().or(z.literal("")),
  gstRegType: z.string().min(1, "Registration type is required"),
  creditPeriod: z.string().optional(),
  creditLimit: z.string().optional(),
  openingBalance: z.string().optional(),
  toReceivePay: z.string().optional(),
});

export const invoiceItemSchema = z.object({
  name: z.string().min(1, "Item name is required"),
  description: z.string().optional(),
  type: z.enum(["Product", "Service"]),
  hsnCode: z.string().optional(),
  sacCode: z.string().optional(),
  qty: z.number().min(0.01, "Quantity must be greater than 0"),
  unit: z.string().min(1, "Unit is required"),
  rate: z.number().min(0, "Rate must be 0 or positive"),
  discountPercent: z.number().min(0).max(100).default(0),
  taxRate: z.number().refine((val) => VALID_GST_RATES.includes(val), "Invalid GST rate"),
  taxType: z.enum(["Inclusive", "Exclusive"]),
  godown: z.string().optional(),
  batch: z.string().optional(),
});

export const invoiceSchema = z.object({
  invoiceNumber: z.string().min(1, "Invoice number is required"),
  date: z.string().min(1, "Date is required"),
  partyName: z.string().min(1, "Party name is required"),
  partyGstin: z.string().optional(),
  partyAddress: z.string().min(1, "Party address is required"),
  partyPlace: z.string().min(1, "Place is required"),
  partyPincode: z.string().min(1, "Pincode is required"),
  partyState: z.string().min(1, "State is required"),
  partyEmail: z.string().optional(),
  partyPhone: z.string().optional(),
  shipToName: z.string().optional(),
  shipToGstin: z.string().optional(),
  shipToAddress: z.string().optional(),
  shipToPlace: z.string().optional(),
  shipToState: z.string().optional(),
  shipToPincode: z.string().optional(),
  items: z.array(invoiceItemSchema).min(1, "At least one line item is required"),
  roundOff: z.number().default(0),
  term: z.string().optional(),
  dueDate: z.string().optional(),
  notesText: z.string().optional(),
  status: z.enum(["Draft", "Completed", "Cancelled"]).default("Completed"),
});
