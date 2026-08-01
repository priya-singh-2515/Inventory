import mongoose, { Schema, Model } from "mongoose";
import { Invoice, PurchaseInvoice } from "@/lib/types/invoice";
import {
  StockLedgerEntry,
  StockAdjustment,
  StockTransfer,
  ItemMaster,
} from "@/lib/types/inventory";
import {
  Party,
  CreditNote,
  DebitNote,
  JournalEntry,
  Voucher,
  Transporter,
  Godown,
  Batch,
} from "@/lib/types/common";
import { CompanyDetails } from "@/lib/types/settings";

// Helper to prevent overwriting models in Next.js HMR.
// Note: the non-generic `mongoose.model(...)` overload is used deliberately.
// The generic form `mongoose.model<T>(...)` makes the TypeScript checker blow
// its heap on this schema set, so the type is applied via a cast instead.
// The generic is type-only, so this is runtime-identical.
function getOrCreateModel<T>(name: string, schema: Schema): Model<T> {
  return (
    (mongoose.models[name] as Model<T>) ||
    (mongoose.model(name, schema) as unknown as Model<T>)
  );
}

// 1. InvoiceItem Schema
const InvoiceItemSchema = new Schema({
  name: { type: String, required: true },
  description: { type: String },
  type: { type: String, enum: ["Product", "Service"], required: true },
  hsnCode: { type: String },
  sacCode: { type: String },
  qty: { type: Number, required: true, default: 1 },
  unit: { type: String },
  rate: { type: Number, required: true, default: 0 },
  taxRate: { type: Number, default: 0 },
  taxType: { type: String, enum: ["Inclusive", "Exclusive"], default: "Exclusive" },
  discountPercent: { type: Number, default: 0 },
  discountAmount: { type: Number, default: 0 },
  igstRate: { type: Number, default: 0 },
  cgstRate: { type: Number, default: 0 },
  sgstRate: { type: Number, default: 0 },
  taxableAmount: { type: Number, default: 0 },
  godown: { type: String },
  batch: { type: String }
});

// 2. Invoice Schema (sales-invoices)
const InvoiceSchema = new Schema(
  {
    invoiceNumber: { type: String, required: true, unique: true },
    date: { type: String, required: true },
    gstin: { type: String },
    partyName: { type: String, required: true },
    partyGstin: { type: String },
    partyAddress: { type: String, required: true },
    partyPlace: { type: String, required: true },
    partyPincode: { type: String, required: true },
    partyState: { type: String, required: true },
    partyEmail: { type: String },
    partyPhone: { type: String },
    shipToName: { type: String },
    shipToGstin: { type: String },
    shipToAddress: { type: String },
    shipToPlace: { type: String },
    shipToState: { type: String },
    shipToPincode: { type: String },
    items: [InvoiceItemSchema],
    totalTaxable: { type: Number, required: true },
    totalTax: { type: Number, required: true },
    totalAmount: { type: Number, required: true },
    roundOff: { type: Number, default: 0 },
    term: { type: String },
    dueDate: { type: String },
    transDistance: { type: Number },
    transportData: {
      transportMode: String,
      docNo: String,
      docDate: String,
      vehicleNo: String,
      dateOfSupply: String,
      placeOfSupply: String,
      transporter: String,
      transporterId: String,
      supplyType: String,
      vehicleType: String
    },
    otherData: {
      poNumber: String,
      poDate: String,
      challanNo: String,
      challanDate: String,
      paymentMode: String,
      optionFields: [{ name: String, value: String }]
    },
    notesText: { type: String },
    status: { type: String, enum: ["Draft", "Completed", "Cancelled"], default: "Completed" }
  },
  { timestamps: true }
);

// 3. PurchaseInvoice Schema (purchase-invoices)
const PurchaseInvoiceSchema = new Schema(
  {
    purchaseInvoiceNumber: { type: String, required: true, unique: true },
    supplierInvoiceNo: { type: String, required: true },
    date: { type: String, required: true },
    supplierName: { type: String, required: true },
    supplierGstin: { type: String },
    supplierAddress: { type: String, required: true },
    supplierState: { type: String, required: true },
    items: [InvoiceItemSchema],
    totalTaxable: { type: Number, required: true },
    totalTax: { type: Number, required: true },
    totalAmount: { type: Number, required: true },
    itcEligibility: {
      type: String,
      enum: ["Inputs", "Capital Goods", "Input Services", "Ineligible"],
      default: "Inputs"
    },
    status: { type: String, enum: ["Draft", "Completed", "Cancelled"], default: "Completed" }
  },
  { timestamps: true }
);

// 4. StockLedger Schema (stock-ledgers)
const StockLedgerSchema = new Schema(
  {
    date: { type: Date, required: true, default: Date.now },
    itemId: { type: Schema.Types.ObjectId, ref: "Item", required: true },
    itemName: { type: String, required: true },
    transactionType: {
      type: String,
      enum: [
        "Sales Invoice",
        "Purchase Invoice",
        "Stock In Adjustment",
        "Stock Out Adjustment",
        "Godown Transfer In",
        "Godown Transfer Out",
        "Credit Note",
        "Debit Note"
      ],
      required: true
    },
    referenceId: { type: String, required: true },
    godown: { type: String },
    batch: { type: String },
    qtyIn: { type: Number, default: 0 },
    qtyOut: { type: Number, default: 0 },
    balanceStock: { type: Number, required: true },
    rate: { type: Number },
    narration: { type: String }
  },
  { timestamps: true }
);

// 5. StockAdjustment Schema (stock-adjustments)
const StockAdjustmentSchema = new Schema(
  {
    adjustmentNo: { type: String, required: true, unique: true },
    date: { type: String, required: true },
    type: { type: String, enum: ["Stock In", "Stock Out"], required: true },
    reason: {
      type: String,
      enum: [
        "Physical Count Variance",
        "Damaged Goods",
        "Expired Stock",
        "Opening Stock Setup",
        "Sample Distribution",
        "Other"
      ],
      required: true
    },
    godown: { type: String },
    items: [
      {
        itemId: { type: Schema.Types.ObjectId, ref: "Item", required: true },
        name: { type: String, required: true },
        qty: { type: Number, required: true },
        unit: { type: String },
        rate: { type: Number, default: 0 },
        batch: { type: String },
        reasonDetails: { type: String }
      }
    ],
    narration: { type: String },
    status: { type: String, enum: ["Completed", "Cancelled"], default: "Completed" }
  },
  { timestamps: true }
);

// 6. StockTransfer Schema (stock-transfers)
const StockTransferSchema = new Schema(
  {
    transferNo: { type: String, required: true, unique: true },
    date: { type: String, required: true },
    sourceGodown: { type: String, required: true },
    destinationGodown: { type: String, required: true },
    items: [
      {
        itemId: { type: Schema.Types.ObjectId, ref: "Item", required: true },
        name: { type: String, required: true },
        qty: { type: Number, required: true },
        unit: { type: String },
        batch: { type: String }
      }
    ],
    narration: { type: String },
    status: { type: String, enum: ["Completed", "Cancelled"], default: "Completed" }
  },
  { timestamps: true }
);

// 7. Party Schema (sales-parties)
const PartySchema = new Schema(
  {
    name: { type: String, required: true },
    gstin: { type: String },
    address: { type: String, required: true },
    state: { type: String, required: true },
    city: { type: String },
    pincode: { type: String },
    partyType: { type: String, enum: ["Customer", "Supplier"], default: "Customer" },
    phone: { type: String },
    email: { type: String },
    gstRegType: { type: String, default: "Regular" },
    creditPeriod: { type: String },
    creditLimit: { type: String },
    openingBalance: { type: String, default: "0" },
    toReceivePay: { type: String, default: "To Receive (Dr.)" }
  },
  { timestamps: true }
);

// 8. Item / Product Master Schema (sales-items)
const ItemSchema = new Schema(
  {
    name: { type: String, required: true },
    type: { type: String, enum: ["Product", "Service"], required: true, default: "Product" },
    sku: { type: String },
    barcode: { type: String },
    hsnCode: { type: String },
    sacCode: { type: String },
    stock: { type: Number, default: 0 },
    minStock: { type: Number, default: 0 },
    reorderQty: { type: Number, default: 0 },
    category: { type: String },
    brand: { type: String },
    group: { type: String },
    unit: { type: String, required: true, default: "NOS" },
    sellingRate: { type: Number, required: true, default: 0 },
    purchaseRate: { type: Number, default: 0 },
    discountPercent: { type: Number, default: 0 },
    taxRate: { type: Number, default: 18 },
    taxRateType: { type: String, enum: ["GST", "Not Applicable"], default: "GST" },
    taxType: { type: String, enum: ["Inclusive", "Exclusive"], default: "Exclusive" },
    location: { type: String },
    narration: { type: String },
    isLowStock: { type: Boolean, default: false }
  },
  { timestamps: true }
);

// 9. Company Schema (companyDetails)
const CompanySchema = new Schema(
  {
    gstin: { type: String, required: true },
    legalName: { type: String, required: true },
    tradeName: { type: String, required: true },
    address1: { type: String, required: true },
    address2: { type: String },
    location: { type: String, required: true },
    pincode: { type: Number, required: true },
    stateCode: { type: String, required: true },
    state: { type: String },
    phone: { type: String, required: true },
    email: { type: String, required: true },
    pan: { type: String },
    bankName: { type: String },
    bankAccountNo: { type: String },
    bankIfsc: { type: String },
    bankBranch: { type: String }
  },
  { timestamps: true }
);

// 10. CreditNote Schema (credit-notes)
const CreditNoteSchema = new Schema(
  {
    creditNoteNo: { type: String, required: true, unique: true },
    invoiceNumber: { type: String },
    date: { type: String, required: true },
    partyName: { type: String, required: true },
    partyGstin: { type: String },
    partyAddress: { type: String, required: true },
    partyState: { type: String, required: true },
    items: [InvoiceItemSchema],
    totalTaxable: { type: Number, required: true },
    totalTax: { type: Number, required: true },
    totalAmount: { type: Number, required: true },
    type: { type: String, default: "Credit Note" },
    status: { type: String, default: "Draft" }
  },
  { timestamps: true }
);

// 11. DebitNote Schema (debit-notes)
const DebitNoteSchema = new Schema(
  {
    debitNoteNo: { type: String, required: true, unique: true },
    purchaseInvoiceNumber: { type: String },
    date: { type: String, required: true },
    partyName: { type: String, required: true },
    partyGstin: { type: String },
    partyAddress: { type: String, required: true },
    partyState: { type: String, required: true },
    items: [InvoiceItemSchema],
    totalTaxable: { type: Number, required: true },
    totalTax: { type: Number, required: true },
    totalAmount: { type: Number, required: true },
    type: { type: String, default: "Debit Note" },
    status: { type: String, default: "Draft" }
  },
  { timestamps: true }
);

// 12. DeliveryChallan Schema (delivery-challans)
const DeliveryChallanSchema = new Schema(
  {
    challanNumber: { type: String, required: true, unique: true },
    date: { type: String, required: true },
    partyName: { type: String, required: true },
    partyAddress: { type: String, required: true },
    items: [InvoiceItemSchema],
    status: { type: String, default: "Draft" }
  },
  { timestamps: true }
);

// 13. Journal Schema (journal-entries)
const JournalSchema = new Schema(
  {
    date: { type: String, required: true },
    voucherNumber: { type: String, required: true, unique: true },
    narration: { type: String },
    entries: [{ ledger: String, debit: Number, credit: Number }]
  },
  { timestamps: true }
);

// 14. Payment & Receipt Schemas
const VoucherSchema = new Schema(
  {
    date: { type: String, required: true },
    voucherNumber: { type: String, required: true },
    party: { type: String, required: true },
    amount: { type: Number, required: true },
    paymentMode: { type: String, default: "Cash" },
    narration: { type: String }
  },
  { timestamps: true }
);

// 15. Transporter, Godown, Batch, Counter
const TransporterSchema = new Schema({ name: { type: String, required: true }, gstin: String });
const GodownSchema = new Schema({ name: { type: String, required: true }, address: String });
const BatchSchema = new Schema({ name: { type: String, required: true }, expiryDate: String });
const CounterSchema = new Schema({ name: { type: String, required: true, unique: true }, value: { type: Number, default: 0 } });

// Document shapes. `_id` is omitted from the domain interfaces because Mongoose
// supplies it as an ObjectId on the hydrated document; keeping the interface's
// optional `string` version would intersect to `never`.
type Doc<T> = Omit<T, "_id">;

interface Counter {
  name: string;
  value: number;
}

// StockLedgerEntry describes the JSON-serialized shape the client receives,
// where `date` and `itemId` arrive as strings. The stored document uses the
// native Date/ObjectId types declared in StockLedgerSchema.
type StockLedgerDoc = Omit<Doc<StockLedgerEntry>, "date" | "itemId"> & {
  date: Date;
  itemId: mongoose.Types.ObjectId;
};

export const InvoiceModel = getOrCreateModel<Doc<Invoice>>("Invoice", InvoiceSchema);
export const PurchaseInvoiceModel = getOrCreateModel<Doc<PurchaseInvoice>>("PurchaseInvoice", PurchaseInvoiceSchema);
export const StockLedgerModel = getOrCreateModel<StockLedgerDoc>("StockLedger", StockLedgerSchema);
export const StockAdjustmentModel = getOrCreateModel<Doc<StockAdjustment>>("StockAdjustment", StockAdjustmentSchema);
export const StockTransferModel = getOrCreateModel<Doc<StockTransfer>>("StockTransfer", StockTransferSchema);
export const PartyModel = getOrCreateModel<Doc<Party>>("Party", PartySchema);
export const ItemModel = getOrCreateModel<Doc<ItemMaster>>("Item", ItemSchema);
export const CompanyModel = getOrCreateModel<Doc<CompanyDetails>>("Company", CompanySchema);
export const CreditNoteModel = getOrCreateModel<Doc<CreditNote>>("CreditNote", CreditNoteSchema);
export const DebitNoteModel = getOrCreateModel<Doc<DebitNote>>("DebitNote", DebitNoteSchema);
export const DeliveryChallanModel = getOrCreateModel("DeliveryChallan", DeliveryChallanSchema);
export const JournalModel = getOrCreateModel<Doc<JournalEntry>>("Journal", JournalSchema);
export const PaymentModel = getOrCreateModel<Doc<Voucher>>("Payment", VoucherSchema);
export const ReceiptModel = getOrCreateModel<Doc<Voucher>>("Receipt", VoucherSchema);
export const TransporterModel = getOrCreateModel<Doc<Transporter>>("Transporter", TransporterSchema);
export const GodownModel = getOrCreateModel<Doc<Godown>>("Godown", GodownSchema);
export const BatchModel = getOrCreateModel<Doc<Batch>>("Batch", BatchSchema);
export const CounterModel = getOrCreateModel<Counter>("Counter", CounterSchema);
