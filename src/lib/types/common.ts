export type PartyType = "Customer" | "Supplier";

export interface Party {
  _id?: string;
  name: string;
  gstin: string;
  address: string;
  state: string;
  city?: string;
  pincode: string;
  partyType: PartyType;
  phone?: string;
  email?: string;
  gstRegType: string;
  creditPeriod?: string;
  creditLimit?: string;
  openingBalance?: string;
  toReceivePay?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreditNote {
  _id?: string;
  creditNoteNo: string;
  invoiceNumber?: string;
  date: string;
  partyName: string;
  partyGstin?: string;
  partyAddress: string;
  partyState: string;
  items: any[];
  totalTaxable: number;
  totalTax: number;
  totalAmount: number;
  type: string;
  status: string;
}

export interface DebitNote {
  _id?: string;
  debitNoteNo: string;
  purchaseInvoiceNumber?: string;
  date: string;
  partyName: string;
  partyGstin?: string;
  partyAddress: string;
  partyState: string;
  items: any[];
  totalTaxable: number;
  totalTax: number;
  totalAmount: number;
  type: string;
  status: string;
}

export interface JournalEntry {
  _id?: string;
  date: string;
  voucherNumber: string;
  narration?: string;
  entries: { ledger: string; debit: number; credit: number }[];
}

export interface Voucher {
  _id?: string;
  date: string;
  voucherNumber: string;
  party: string;
  amount: number;
  paymentMode: string;
  narration?: string;
}

export interface Transporter {
  _id?: string;
  name: string;
  gstin?: string;
}

export interface Godown {
  _id?: string;
  name: string;
  address?: string;
}

export interface Batch {
  _id?: string;
  name: string;
  expiryDate?: string;
}
