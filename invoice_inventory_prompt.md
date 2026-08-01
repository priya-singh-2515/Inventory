# 📋 Prompt: Build Invoice & Inventory Management System

> Copy and paste this prompt into any AI coding assistant (ChatGPT, Claude, Gemini, Copilot, etc.) to generate a similar project from scratch.

---

## THE PROMPT

---

Build a full-stack **Invoice & Inventory Management System** as a **Next.js 15+ App Router** web application using **React 19**, **TypeScript**, **MongoDB (Mongoose)**, **Tailwind CSS v3**, and **shadcn/ui** components. The app is Indian GST-compliant with full purchase billing, automated stock ledger tracking, stock adjustments, inter-godown transfers, low stock alerts, and sales billing, but does **NOT** include e-Invoice or e-Way Bill generation features.

---

### 🏗️ TECH STACK

| Layer | Technology |
|---|---|
| Framework | Next.js 15 (App Router, `"use client"` where needed) |
| Language | TypeScript (strict) |
| Styling | Tailwind CSS v3 + shadcn/ui (Radix UI primitives) |
| Database | MongoDB via Mongoose |
| Forms | react-hook-form + Zod validation |
| Icons | lucide-react |
| PDF Export | jsPDF + html2canvas |
| Date | date-fns, react-day-picker |
| Drag & Drop | @dnd-kit/core + @dnd-kit/sortable |
| Fonts | Figtree, Metropolis (via @fontsource) |
| Testing | Jest + @testing-library/react + Cypress (E2E) |
| Linting | Biome |

---

### 🗄️ DATABASE MODELS (MongoDB / Mongoose)

#### 1. `Invoice` (collection: `sales-invoices`)
```typescript
invoiceNumber: String (required)
date: String (required)
gstin: String (company GSTIN)
partyName: String (required)
partyGstin: String
partyAddress: String (required)
partyPlace: String (required)
partyPincode: String (required)
partyState: String (required)
partyEmail: String
partyPhone: String
shipToName: String
shipToGstin: String
shipToAddress: String
shipToPlace: String
shipToState: String
shipToPincode: String
items: [InvoiceItem]
totalTaxable: Number (required)
totalTax: Number (required)
totalAmount: Number (required)
roundOff: Number (default: 0)
term: String (payment terms)
dueDate: String
transDistance: Number
transportData: {
  transportMode, docNo, docDate, vehicleNo,
  dateOfSupply, placeOfSupply, transporter,
  transporterId, supplyType, vehicleType
}
otherData: {
  poNumber, poDate, challanNo, challanDate,
  paymentMode, optionFields: [{name, value}]
}
notesText: String
status: enum ["Draft", "Cancelled"]
timestamps: true
```

#### `InvoiceItem` (sub-document)
```typescript
name, description, type: enum["Product","Service"]
hsnCode (for products), sacCode (for services)
qty, unit, rate
taxRate: one of [0, 0.1, 0.25, 1, 1.5, 3, 5, 6, 7.5, 12, 18, 28, 40]
taxType: enum["Inclusive","Exclusive"]
discountPercent, discountAmount
igstRate, cgstRate, sgstRate, taxableAmount
godown, batch
```

#### 2. `PurchaseInvoice` (collection: `purchase-invoices`)
Same item-line structure as `Invoice`, with supplier details & Input Tax Credit (ITC) tracking:
```typescript
purchaseInvoiceNumber: String (required)
supplierInvoiceNo: String (required)
date: String (required)
supplierName: String (required)
supplierGstin: String
supplierAddress: String (required)
supplierState: String (required)
items: [InvoiceItem]
totalTaxable: Number (required)
totalTax: Number (required)
totalAmount: Number (required)
itcEligibility: enum ["Inputs", "Capital Goods", "Input Services", "Ineligible"] (default: "Inputs")
status: enum ["Draft", "Completed", "Cancelled"]
timestamps: true
```

#### 3. `StockLedger` (collection: `stock-ledgers`) - Inventory Audit Trail
```typescript
date: Date (required)
itemId: ObjectId (ref: Item, required)
itemName: String (required)
transactionType: enum ["Sales Invoice", "Purchase Invoice", "Stock In Adjustment", "Stock Out Adjustment", "Godown Transfer In", "Godown Transfer Out", "Credit Note", "Debit Note"] (required)
referenceId: String (invoiceNo / adjustmentNo / transferNo)
godown: String
batch: String
qtyIn: Number (default: 0)
qtyOut: Number (default: 0)
balanceStock: Number (required)
rate: Number
narration: String
timestamps: true
```

#### 4. `StockAdjustment` (collection: `stock-adjustments`)
```typescript
adjustmentNo: String (required)
date: String (required)
type: enum ["Stock In", "Stock Out"] (required)
reason: enum ["Physical Count Variance", "Damaged Goods", "Expired Stock", "Opening Stock Setup", "Sample Distribution", "Other"]
godown: String
items: [{
  itemId: ObjectId (ref: Item),
  name: String,
  qty: Number,
  unit: String,
  rate: Number,
  batch: String,
  reasonDetails: String
}]
narration: String
status: enum ["Completed", "Cancelled"]
timestamps: true
```

#### 5. `StockTransfer` (collection: `stock-transfers`)
```typescript
transferNo: String (required)
date: String (required)
sourceGodown: String (required)
destinationGodown: String (required)
items: [{
  itemId: ObjectId (ref: Item),
  name: String,
  qty: Number,
  unit: String,
  batch: String
}]
narration: String
status: enum ["Completed", "Cancelled"]
timestamps: true
```

#### 6. `Party` (collection: `sales-parties`)
```typescript
name: String (required)
gstin: String (required, 15-char)
address: String (required)
state: String (required)
city: String
pincode: String (6-digit)
partyType: enum["Customer","Supplier"]
phone, email
gstRegType: String (e.g., "Regular", "Unregistered", "Composition")
creditPeriod, creditLimit, openingBalance
toReceivePay: String (e.g., "To Receive (Dr.)", "To Pay (Cr.)")
timestamps: true
```

#### 7. `Item` / Product Master (collection: `sales-items`)
```typescript
name: String (required)
type: enum["Product","Service"] (required)
sku: String (optional, unique)
barcode: String (optional)
hsnCode (for products), sacCode (for services)
stock: Number (current stock level)
minStock: Number (reorder point trigger)
reorderQty: Number (suggested order quantity)
category, brand: String
group: String
unit: String (required for products)
qty: Number
sellingRate: Number (required)
purchaseRate: Number (cost price)
discountPercent: Number
taxRate: Mixed
taxRateType: enum["GST","Not Applicable"]
taxType: enum["Inclusive","Exclusive"] (required)
location, narration: String
isLowStock: Boolean (auto-computed: stock <= minStock)
timestamps: true
```

#### 8. `Company` (collection: `companyDetails`)
```typescript
gstin: String (required, 15-char GSTIN)
legalName, tradeName: String (required)
address1: String (required)
address2: String (optional)
location: String (required)
pincode: Number (6-digit, required)
stateCode: String (required)
state: String
phone: String (required)
email: String (required)
pan: String
```

#### 9. `CreditNote` (collection: `credit-notes`)
Same structure as Invoice plus:
```typescript
creditNoteNo: String
type: String (default: "Credit Note")
status: String (default: "Draft")
```

#### 10. `DebitNote` (collection: `debit-notes`)
Same structure as CreditNote but:
```typescript
debitNoteNo: String
type: String (default: "Debit Note")
```

#### 11. `DeliveryChallan` (collection: `delivery-challans`)
Simplified invoice-like structure without GST tax computation.

#### 12. `Journal` (collection: `journal-entries`)
```typescript
date, voucherNumber, narration
entries: [{ledger, debit, credit}]
```

#### 13. `Payment` and `Receipt` (separate collections)
```typescript
date, voucherNumber, party, amount, paymentMode, narration
```

#### 14. `Transporter`
```typescript
name: String (required, max 100 chars)
gstin: String (optional, 15-char transporter ID or GSTIN)
```

#### 15. `Godown` and `Batch`
Master collections for warehouse locations and item batches with location address & capacity metadata.

#### 16. `Counter`
Auto-increment counters for invoice numbers, purchase bill numbers, credit notes, stock adjustment numbers, etc.
```typescript
name: String (e.g., "sales-invoice", "purchase-invoice", "stock-adjustment", "stock-transfer")
value: Number
```

---

### 🗂️ PROJECT STRUCTURE

```
src/
├── app/
│   ├── page.tsx                    # Home / Navigation Hub
│   ├── layout.tsx                  # Root layout with providers & toast
│   ├── globals.css
│   ├── sales/
│   │   ├── page.tsx                # Sales invoice list (mobile + desktop)
│   │   ├── components/
│   │   │   ├── InvoiceListItem.tsx # Card showing invoice summary
│   │   │   └── SalesActionButtons.tsx # "New Invoice", "Add Party", "Add Product" buttons
│   │   ├── hooks/
│   │   │   └── useSalesInvoicesList.ts
│   │   ├── new/
│   │   │   ├── page.tsx            # Redirects to create form
│   │   │   ├── hooks/              # useCreateSalesInvoice hook
│   │   │   ├── add-item/           # Add item to invoice flow
│   │   │   ├── add-party/          # Add party sub-page
│   │   │   ├── add-product/        # Add product master
│   │   │   ├── edit-item/          # Edit existing item in invoice
│   │   │   ├── edit-master/        # Edit product master
│   │   │   └── edit-party/         # Edit party details
│   │   └── [id]/
│   │       ├── page.tsx            # Invoice detail view
│   │       ├── edit/               # Edit existing invoice
│   │       └── share/              # Share/print/PDF invoice
│   ├── purchases/                  # Purchase Invoice management
│   │   ├── page.tsx                # Purchase bills list
│   │   ├── new/                    # Create purchase bill
│   │   └── [id]/                   # Purchase bill detail
│   ├── inventory/                  # Inventory & Stock Hub
│   │   ├── page.tsx                # Item stock master list + Low stock alerts + Stock Valuation summary
│   │   ├── adjustments/            # Stock In / Stock Out list & new adjustment
│   │   ├── transfers/              # Inter-godown transfer list & new transfer
│   │   └── [id]/
│   │       └── ledger/             # Item stock movement history timeline
│   ├── invoices/                   # Legacy invoice list (similar to /sales)
│   ├── credit-notes/               # Credit note list + create + detail
│   ├── debit-notes/                # Debit note list + create + detail
│   ├── delivery-challan/           # Delivery challan create + detail
│   ├── journal/
│   │   └── new/                    # New journal entry (mobile flow)
│   ├── payment/
│   │   └── new/                    # New payment voucher (mobile flow)
│   ├── receipt/
│   │   └── new/                    # New receipt voucher (mobile flow)
│   ├── transactions/               # All ledger, payment & receipt list
│   ├── dashboard/                  # Analytics, stock valuation & sales charts
│   ├── settings/
│   │   └── page.tsx                # Company details + invoice settings tabs
│   └── api/
│       ├── invoices/               # CRUD for sales invoices
│       ├── purchases/              # CRUD for purchase bills
│       ├── inventory/
│       │   ├── summary/            # Stock valuation & low-stock alerts API
│       │   └── ledger/             # Stock movement log API
│       ├── stock-adjustments/      # Stock In / Stock Out API
│       ├── stock-transfers/        # Godown transfer API
│       ├── parties/                # CRUD for parties
│       ├── items/                  # CRUD for item/product master
│       ├── credit-notes/
│       ├── debit-notes/
│       ├── delivery-challans/
│       ├── journals/
│       ├── payments/
│       ├── receipts/
│       ├── company/                # Company settings
        ├── counters/               # Auto-increment number generation
│       ├── transporters/
│       ├── godowns/
│       └── batches/
├── components/
│   ├── invoices/
│   │   ├── AddPartySheet.tsx       # Slide-in drawer to add/edit party
│   │   ├── AddProductScreen.tsx    # Screen to add product to master
│   │   ├── AddToSaleScreen.tsx     # Full item-to-invoice selection screen
│   │   ├── AddTransporterSheet.tsx # Add transporter
│   │   ├── AdditionalDetailsSection.tsx
│   │   ├── BillToSection.tsx       # Party/customer selection
│   │   ├── CreateInvoiceMobile.tsx # Mobile invoice creation wrapper
│   │   ├── CustomerDropdownSheet.tsx
│   │   ├── EditMasterScreen.tsx    # Edit product master
│   │   ├── InvoiceMetaBar.tsx      # Invoice number + date bar
│   │   ├── ItemsSection.tsx        # Line items table/list
│   │   ├── NotesSheet.tsx          # Invoice notes drawer
│   │   ├── OtherDetailsSheet.tsx   # PO number, challan, payment mode
│   │   ├── TotalsSection.tsx       # Subtotal, tax, discount, grand total
│   │   ├── TransportDetailsSheet.tsx  # Transport mode, vehicle, doc
│   │   ├── TransporterSelectionSheet.tsx
│   │   ├── compliance-form.tsx     # Additional compliance fields
│   │   ├── desktop/                # Desktop-specific invoice form layout
│   │   └── preview/                # Invoice PDF preview templates
│   ├── inventory/
│   │   ├── StockAdjustmentSheet.tsx# Modal/Sheet for Stock In / Out
│   │   ├── StockTransferSheet.tsx  # Modal/Sheet for Godown transfer
│   │   ├── StockLedgerTable.tsx    # Movement history table
│   │   ├── LowStockBadge.tsx       # Low stock warning pill
│   │   └── StockValuationCard.tsx  # Summary card of stock valuation
│   ├── purchases/
│   │   └── PurchaseInvoiceForm.tsx # Supplier bill form
│   ├── credit-notes/               # Credit note specific components
│   ├── debit-notes/                # Debit note specific components
│   ├── delivery-challan/
│   ├── gst/
│   │   └── state-select.tsx        # Indian state dropdown (GST state codes)
│   ├── journal/
│   ├── payment/
│   ├── receipt/
│   ├── layout/
│   │   ├── desktop/
│   │   │   ├── DesktopHeader.tsx   # Top header with company name & low stock alerts
│   │   │   └── DesktopSidebar.tsx  # Left nav sidebar
│   │   └── mobile/
│   │       └── MobileHeader.tsx    # Mobile top bar with back button
│   ├── providers/                  # Context providers (toast, etc.)
│   └── ui/                         # shadcn/ui components (button, input, card, dialog, badge, etc.)
├── lib/
│   ├── mongodb.ts                  # Mongoose connection utility
│   ├── models.ts                   # Re-exports all models
│   ├── models/                     # All Mongoose models (see above)
│   ├── schemas/
│   │   ├── invoice-schemas.ts      # Zod schemas for invoice forms
│   │   ├── purchase-schemas.ts     # Zod schemas for purchase bills
│   │   ├── inventory-schemas.ts    # Zod schemas for stock adjustments & transfers
│   │   └── gst-schemas.ts          # GST-specific validation schemas
│   ├── services/
│   │   ├── invoice-calculator.ts   # GST tax calculation logic
│   │   ├── sales-invoice-service.ts
│   │   ├── purchase-service.ts
│   │   ├── stock-engine-service.ts # Real-time stock movement & ledger updates
│   │   ├── stock-adjustment-service.ts
│   │   ├── stock-transfer-service.ts
│   │   ├── sales-item-service.ts
│   │   ├── sales-party-service.ts
│   │   ├── credit-note-service.ts
│   │   ├── debit-note-service.ts
│   │   ├── voucher-service.ts      # Journal, payment, receipt
│   │   └── mapping-service.ts      # DB → UI data mapping
│   ├── types/
│   │   ├── invoice.ts              # TypeScript interfaces (Invoice, InvoiceItem, etc.)
│   │   ├── inventory.ts            # StockLedger, StockAdjustment, StockTransfer types
│   │   ├── settings.ts             # Company/settings types
│   │   └── common.ts
│   ├── constants/                  # GST rates, Indian states, units, stock adjustment reasons, etc.
│   ├── utils/
│   │   ├── invoice-utils.ts        # GSTIN validation, number formatting
│   │   ├── item-utils.ts           # Master item helpers
│   │   └── friendly-error.ts       # Human-readable error messages
│   └── data/                       # Static data (Indian states list, HSN codes)
├── hooks/
│   └── use-toast.ts
├── common/
│   └── regex.ts                    # GSTIN, pincode, HSN, vehicle number regexes
└── types/                          # Global type augmentations
```

---

### 🎨 UI/UX REQUIREMENTS

#### Dual Layout (Mobile + Desktop)
- **Mobile** (`lg:hidden`): Full-screen flow, bottom-sticky action bar, slide-in sheets/drawers for sub-actions
- **Desktop** (`hidden lg:block`): Left sidebar (303px wide) + top header (86px high) + main content area with cards in grid

#### Design System
- **Colors**: Primary blue (`#0b2641`), Background gray (`#f0f4f7`), Warning Amber (`#f59e0b` for low stock), Danger Red (`#ef4444`), Card white with `#e5e5e5` border
- **Typography**: Figtree font for body, Metropolis for headings
- **Spacing**: 14px horizontal padding mobile, 30px desktop
- **Components**: Rounded cards (`rounded-[8px]`), subtle shadows, smooth transitions

#### Key UX Patterns
- Sheets/Drawers for party selection, item addition, transport details, stock adjustments, notes
- Auto-search / combobox for party, product, godown, and batch selection
- Real-time GST calculation as user changes qty/rate/taxRate
- Visual Low Stock Alerts with reorder indicator badge
- Invoice & Purchase bill auto-generation with prefix support (e.g., "INV-001", "PUR-001")
- Sticky totals section always visible while scrolling items
- Print/PDF preview with professional template

---

### 📄 CORE FEATURES

#### 1. Sales Invoice Management
**List page** (`/sales`):
- Show all invoices as cards: party name, invoice number, date, amount, status badge
- Action buttons: "New Sale", "Add Party", "Add Product"
- Mobile: vertical list; Desktop: 3-column grid

**Create/Edit Invoice** (`/sales/new`, `/sales/[id]/edit`):
- **Step 1 - Party Selection**: Search existing parties or add new on-the-fly via sheet
- **Step 2 - Item Addition**: Search product master → set qty, rate, discount, tax rate, godown, batch
- **Step 3 - Totals**: Auto-calculated taxable, CGST/SGST/IGST (based on state), round-off, grand total
- **Step 4 - Additional Details**: Transport details, PO details, Notes, Ship-to address
- **Automated Stock Engine**: Decreases product stock level and inserts a `StockLedger` audit record (`qtyOut = item.qty`).

#### 2. Purchase Invoice Management (`/purchases`)
- Record purchase bills received from suppliers
- Select supplier party, input supplier invoice number, date, items, cost rates, and GST rates
- Track Input Tax Credit (ITC) eligibility (Inputs, Capital Goods, Input Services, Ineligible)
- **Automated Stock Engine**: Increases product stock level and inserts a `StockLedger` audit record (`qtyIn = item.qty`).

#### 3. Stock Engine & Inventory Audit Trail (`stock-engine-service.ts`)
- **Real-Time Stock Updates**:
  - Purchase Bill / Credit Note / Stock In Adjustment → **+ Stock** (`qtyIn`)
  - Sales Invoice / Debit Note / Stock Out Adjustment → **- Stock** (`qtyOut`)
  - Godown Transfer → Move stock from `sourceGodown` to `destinationGodown`
- **Immutable Stock Ledger**: Creates a transparent audit entry for every transaction containing `date`, `itemId`, `transactionType`, `referenceId`, `qtyIn`, `qtyOut`, and `balanceStock`.
- **Low Stock Engine**: Automatically computes `isLowStock = (item.stock <= item.minStock)` on every inventory movement.

#### 4. Stock Adjustments & Reconciliation (`/inventory/adjustments`)
- Perform Stock In (increase) or Stock Out (decrease) entries
- Select adjustment reason: Physical Count Variance, Damaged Goods, Expired Stock, Opening Stock Setup, Sample Distribution
- Update godown stock and generate stock movement ledger entries

#### 5. Inter-Godown Stock Transfers (`/inventory/transfers`)
- Transfer inventory between different warehouses/godowns
- Select `sourceGodown`, `destinationGodown`, items, batches, and quantities
- Updates godown stock allocation and logs transfer ledger records

#### 6. Inventory Hub & Analytics (`/inventory`)
- **Stock Master Table**: List all products with current stock, min stock level, unit, selling rate, purchase rate, and low-stock badge
- **Low Stock Filter**: One-click filter for items requiring reorder
- **Stock Valuation Summary**: Calculates total inventory value at Cost Price (`sum(stock * purchaseRate)`) and Selling Price (`sum(stock * sellingRate)`)
- **Item Stock Ledger View** (`/inventory/[id]/ledger`): Interactive timeline showing all historic stock movements for a specific item.

#### 7. GST Tax Engine (`invoice-calculator.ts`)
```
- Determine intra-state (CGST+SGST) vs inter-state (IGST) based on party state vs company state
- For each item:
  - If taxType = "Exclusive": taxableAmount = qty × rate × (1 - discountPercent/100)
  - If taxType = "Inclusive": taxableAmount = lineTotal / (1 + taxRate/100)
  - Calculate CGST = taxableAmount × (taxRate/2) / 100 (intra-state)
  - Calculate IGST = taxableAmount × taxRate / 100 (inter-state)
- Total: sum all taxableAmounts + sum all taxes + roundOff
```

#### 8. Party Master Management
- CRUD for customers and suppliers
- Fields: Name, GSTIN (validated 15-char), Address, State (dropdown with Indian GST state codes), City, Pincode, Phone, Email, GST Registration Type, Credit Period, Credit Limit, Opening Balance
- GSTIN validation: checksum algorithm + regex
- Add-party sheet accessible from invoice & purchase bill creation flow

#### 9. Product / Item Master Management
- CRUD for products and services
- Products: SKU, barcode, HSN code (4/6/8 digits), unit (NOS/KG/LTR/etc.), stock tracking, min stock (reorder level), reorder qty, category, brand, cost price, selling price, godown
- Services: SAC code (4/6/8 digits)
- Common: name, rate, tax rate (GST %), tax type (Inclusive/Exclusive), discount %, group/category
- Quick-add from invoice or purchase bill creation flow

#### 10. Credit Notes (`/credit-notes`)
- Link to original invoice or standalone
- Increases stock for returned items and logs credit note stock ledger entry

#### 11. Debit Notes (`/debit-notes`)
- Mirror of Credit Notes (decreases stock for returned purchase items)

#### 12. Delivery Challan (`/delivery-challan`)
- Simplified invoice without GST computation for goods dispatch tracking

#### 13. Journal Entry (`/journal/new`)
- Double-entry bookkeeping with debit/credit ledger entries

#### 14. Payment Voucher (`/payment/new`) & Receipt Voucher (`/receipt/new`)
- Record incoming/outgoing payments linked to customer or supplier parties

#### 15. All Transactions (`/transactions`)
- Unified list of journals, payments, and receipts with type/party/date filters

#### 16. Dashboard (`/dashboard`)
- Summary cards: Total Sales (month), Total Purchases, Outstanding Receivables/Payables, Stock Valuation, Tax Collected/Input Tax Credit
- Charts: Monthly sales vs purchase trend, Top selling products, Low stock warnings breakdown

#### 17. Settings (`/settings`)
- **Company Details**: Legal name, trade name, GSTIN, address, state, phone, email
- **Invoice Settings**: Number prefix/series, default payment terms, default notes
- **Bank Details**: Bank name, account no, IFSC, branch (shown on invoice PDF)

#### 18. Invoice PDF / Print (`/sales/[id]/share`)
- Professional printable template showing letterhead, party details, item table with HSN, taxes, bank details, and signature area
- Export as PDF (jsPDF + html2canvas) & share via WhatsApp

---

### 🔌 API ROUTES (Next.js Route Handlers)

```
GET    /api/invoices              → list all sales invoices
POST   /api/invoices              → create invoice & update stock ledger
GET    /api/invoices/[id]         → get single invoice
PUT    /api/invoices/[id]         → update invoice & sync stock
DELETE /api/invoices/[id]         → delete/cancel invoice & revert stock

GET    /api/purchases             → list all purchase bills
POST   /api/purchases             → create purchase bill & add stock
GET    /api/purchases/[id]        → get single purchase bill
PUT    /api/purchases/[id]        → update purchase bill & sync stock
DELETE /api/purchases/[id]        → delete/cancel purchase bill & revert stock

GET    /api/inventory/summary     → stock valuation & low-stock counts
GET    /api/inventory/ledger      → query stock movement ledger history

GET    /api/stock-adjustments     → list stock adjustments
POST   /api/stock-adjustments     → create stock adjustment (Stock In/Out)

GET    /api/stock-transfers       → list godown stock transfers
POST   /api/stock-transfers       → create stock transfer

GET    /api/parties               → list parties
POST   /api/parties               → create party
PUT    /api/parties/[id]          → update party
DELETE /api/parties/[id]          → delete party

GET    /api/items                 → list product/item master
POST   /api/items                 → create item
PUT    /api/items/[id]            → update item
DELETE /api/items/[id]            → delete item

GET    /api/credit-notes          → list credit notes
POST   /api/credit-notes          → create credit note & update stock

GET    /api/debit-notes           → list debit notes
POST   /api/debit-notes           → create debit note & update stock

GET    /api/delivery-challans     → list challans
POST   /api/delivery-challans     → create challan

GET    /api/journals              → list journal entries
POST   /api/journals              → create journal

GET    /api/payments              → list payments
POST   /api/payments              → create payment

GET    /api/receipts              → list receipts
POST   /api/receipts              → create receipt

GET    /api/company               → get company details
POST   /api/company               → save company details

GET    /api/counters/[name]       → get next number (invoice/purchase/adjustment)
POST   /api/counters/[name]       → increment counter

GET    /api/transporters          → list transporters
POST   /api/transporters          → create transporter

GET    /api/godowns               → list godowns
POST   /api/godowns               → create godown

GET    /api/batches               → list batches
POST   /api/batches               → create batch
```

---

### ✅ ZOD VALIDATION SCHEMAS

```typescript
// Party schema
partySchema = {
  name: string().min(1),
  gstin: string().regex(GSTIN_REGEX).optional(),
  address: string().min(1),
  state: string().min(1),
  pincode: string().regex(/^\d{6}$/),
  partyType: enum(["Customer","Supplier"]),
  gstRegType: string().min(1),
  creditPeriod, creditLimit, openingBalance: string().optional()
}

// Product / Item Master schema
itemSchema = {
  name: string().min(1),
  type: enum(["Product","Service"]),
  sku: string().optional(),
  barcode: string().optional(),
  hsnCode: string().regex(/^\d{4}(\d{2}(\d{2})?)?$/).optional(),
  sacCode: string().regex(/^\d{4}(\d{2}(\d{2})?)?$/).optional(),
  stock: number().default(0),
  minStock: number().min(0).default(0),
  reorderQty: number().min(0).default(0),
  category: string().optional(),
  brand: string().optional(),
  unit: string(),
  sellingRate: number().min(0),
  purchaseRate: number().min(0).optional(),
  taxRate: number().refine(val => VALID_GST_RATES.includes(val)),
  taxType: enum(["Inclusive","Exclusive"])
}

// Invoice item schema
invoiceItemSchema = {
  name: string().min(1),
  type: enum(["Product","Service"]),
  hsnCode: string().regex(/^\d{4}(\d{2}(\d{2})?)?$/).optional(),
  sacCode: string().regex(/^\d{4}(\d{2}(\d{2})?)?$/).optional(),
  qty: number().min(0),
  rate: number().min(0),
  discountPercent: number().min(0).max(100),
  taxRate: number().refine(val => VALID_GST_RATES.includes(val)),
  taxType: enum(["Inclusive","Exclusive"]),
  unit: string() // required for Product
}

// Stock Adjustment schema
stockAdjustmentSchema = {
  date: string().min(1),
  type: enum(["Stock In", "Stock Out"]),
  reason: enum ["Physical Count Variance", "Damaged Goods", "Expired Stock", "Opening Stock Setup", "Sample Distribution", "Other"],
  godown: string().optional(),
  items: array({
    itemId: string().min(1),
    name: string().min(1),
    qty: number().gt(0),
    unit: string(),
    rate: number().min(0).optional(),
    batch: string().optional(),
    reasonDetails: string().optional()
  }).min(1)
}

// Stock Transfer schema
stockTransferSchema = {
  date: string().min(1),
  sourceGodown: string().min(1),
  destinationGodown: string().min(1),
  items: array({
    itemId: string().min(1),
    name: string().min(1),
    qty: number().gt(0),
    unit: string(),
    batch: string().optional()
  }).min(1)
}

// Transport details schema
transportDetailsSchema = {
  transportMode: string(),
  vehicleNo: string().regex(VEHICLE_NO_REGEX), // e.g., MH01AB1234
  docNo: string().max(16),
  docDate, dateOfSupply, placeOfSupply: string().optional(),
  transporter: string(), transporterId: string(),
  supplyType: enum(["B2B","SEZWP","SEZWOP","EXPWP","WXPWOP","DEXP"]).optional(),
  vehicleType: enum(["R","O"]).optional() // Regular/Over-dimensional
}

// Other details schema
otherDetailsSchema = {
  poNumber, poDate, challanNo, challanDate: string().optional(),
  paymentMode: string().optional(),
  optionFields: [{name: string(), value: string()}]
}
```

---

### 🇮🇳 INDIAN GST SPECIFICS

1. **GSTIN Validation**: 15-char format `[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}` + checksum
2. **State Codes**: All 37 Indian states/UTs with GST state codes (01-38)
3. **Tax Splitting**: Intra-state → CGST (half rate) + SGST (half rate); Inter-state → IGST (full rate)
4. **Input Tax Credit (ITC)**: Track ITC eligibility on purchases (Inputs, Capital Goods, Input Services)
5. **HSN Codes**: 4, 6, or 8 digit classification for goods
6. **SAC Codes**: 4, 6, or 8 digit classification for services
7. **GST Registration Types**: Regular, Composition, Unregistered, Consumer, SEZ Unit, SEZ Developer, Overseas

---

### 🔧 ENVIRONMENT VARIABLES

```env
MONGODB_URI=mongodb://localhost:27017/invoice-db
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

---

### 📱 RESPONSIVE BREAKPOINTS

- Mobile: default (< 1024px) — single column, bottom sheets, hamburger navigation
- Desktop: `lg:` and above (≥ 1024px) — sidebar + header layout, multi-column grids

---

### 🚫 EXPLICITLY EXCLUDED FEATURES

- ❌ E-Invoice (IRN generation, NIC API integration, QR code signing)
- ❌ E-Way Bill (EWB generation, NIC portal integration)
- ❌ GST return filing (GSTR-1, GSTR-3B)
- ❌ Multi-company / multi-branch
- ❌ User authentication / role-based access control
- ❌ Cloud file storage / image uploads

---

### 🚀 GETTING STARTED STEPS (for the AI to follow)

1. Initialize: `npx create-next-app@latest ./ --typescript --tailwind --app --no-src-dir` (then move to src/)
2. Install dependencies listed above
3. Set up MongoDB connection in `src/lib/mongodb.ts`
4. Create all Mongoose models (Invoices, Purchases, StockLedger, StockAdjustment, StockTransfer, Item, Party, Company, etc.)
5. Build Stock Engine service (`src/lib/services/stock-engine-service.ts`) for transactional stock updates and stock ledger history
6. Set up all API route handlers (Sales, Purchases, Inventory Summary & Ledger, Stock Adjustments, Transfers)
7. Create Zod validation schemas
8. Build shared UI components (shadcn/ui setup)
9. Implement the dual mobile/desktop layout system
10. Build each module: Sales → Purchases → Inventory & Stock Ledger → Credit Notes → Debit Notes → Delivery Challan → Journal → Payment → Receipt → Dashboard → Settings
11. Add invoice PDF preview and print functionality
12. Wire up all forms with react-hook-form + Zod
13. Add GST tax calculation engine & low stock alert UI indicators
14. Connect everything to MongoDB API routes

---

> **Note for AI**: Maintain the same clean code architecture throughout: services for business logic, separate API route handlers, shared Zod schemas for validation, React hooks for data fetching, and component composition. Do not mix business logic into UI components.
