export type InvoiceItemType = "Product" | "Service";
export type TaxType = "Inclusive" | "Exclusive";
export type InvoiceStatus = "Draft" | "Cancelled" | "Completed";

export interface InvoiceItem {
  _id?: string;
  name: string;
  description?: string;
  type: InvoiceItemType;
  hsnCode?: string;
  sacCode?: string;
  qty: number;
  unit: string;
  rate: number;
  taxRate: number;
  taxType: TaxType;
  discountPercent: number;
  discountAmount: number;
  igstRate: number;
  cgstRate: number;
  sgstRate: number;
  taxableAmount: number;
  godown?: string;
  batch?: string;
}

export interface TransportData {
  transportMode?: string;
  docNo?: string;
  docDate?: string;
  vehicleNo?: string;
  dateOfSupply?: string;
  placeOfSupply?: string;
  transporter?: string;
  transporterId?: string;
  supplyType?: string;
  vehicleType?: string;
}

export interface OtherOptionField {
  name: string;
  value: string;
}

export interface OtherData {
  poNumber?: string;
  poDate?: string;
  challanNo?: string;
  challanDate?: string;
  paymentMode?: string;
  optionFields?: OtherOptionField[];
}

export interface Invoice {
  _id?: string;
  invoiceNumber: string;
  date: string;
  gstin?: string;
  partyName: string;
  partyGstin?: string;
  partyAddress: string;
  partyPlace: string;
  partyPincode: string;
  partyState: string;
  partyEmail?: string;
  partyPhone?: string;
  shipToName?: string;
  shipToGstin?: string;
  shipToAddress?: string;
  shipToPlace?: string;
  shipToState?: string;
  shipToPincode?: string;
  items: InvoiceItem[];
  totalTaxable: number;
  totalTax: number;
  totalAmount: number;
  roundOff: number;
  term?: string;
  dueDate?: string;
  transDistance?: number;
  transportData?: TransportData;
  otherData?: OtherData;
  notesText?: string;
  status: InvoiceStatus;
  createdAt?: string;
  updatedAt?: string;
}

export interface PurchaseInvoice {
  _id?: string;
  purchaseInvoiceNumber: string;
  supplierInvoiceNo: string;
  date: string;
  supplierName: string;
  supplierGstin?: string;
  supplierAddress: string;
  supplierState: string;
  items: InvoiceItem[];
  totalTaxable: number;
  totalTax: number;
  totalAmount: number;
  itcEligibility: "Inputs" | "Capital Goods" | "Input Services" | "Ineligible";
  status: InvoiceStatus;
  createdAt?: string;
  updatedAt?: string;
}
