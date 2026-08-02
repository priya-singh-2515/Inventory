/**
 * Document numbering and defaults, stored on the company record.
 *
 * Each company keeps its own series, so changing a prefix here affects only
 * that company's future documents — existing numbers are never rewritten.
 */
export interface InvoiceSettings {
  invoicePrefix: string;
  purchasePrefix: string;
  creditNotePrefix: string;
  debitNotePrefix: string;
  defaultPaymentTerms: string;
  defaultNotes: string;
}

export interface CompanyDetails extends Partial<InvoiceSettings> {
  _id?: string;
  /** Set by the server from the session; never accepted from a request body. */
  ownerId?: string;
  gstin: string;
  legalName: string;
  tradeName: string;
  address1: string;
  address2?: string;
  location: string;
  pincode: number;
  stateCode: string;
  state: string;
  phone: string;
  email: string;
  pan?: string;
  bankName?: string;
  bankAccountNo?: string;
  bankIfsc?: string;
  bankBranch?: string;
}
