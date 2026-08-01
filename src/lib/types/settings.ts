export interface CompanyDetails {
  _id?: string;
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

export interface InvoiceSettings {
  invoicePrefix: string;
  purchasePrefix: string;
  defaultPaymentTerms: string;
  defaultNotes: string;
}
