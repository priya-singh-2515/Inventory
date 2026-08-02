import {
  CompanyModel,
  InvoiceModel,
  PurchaseInvoiceModel,
  ItemModel,
  PartyModel,
  CreditNoteModel,
  DebitNoteModel,
  StockAdjustmentModel,
  StockTransferModel,
  StockLedgerModel,
  GodownModel,
  BatchModel,
  TransporterModel,
  CounterModel,
  CompanyMemberModel,
} from "@/lib/models";

export const EXPORT_FORMAT = "inventory-company-export";
export const EXPORT_VERSION = 1;

/**
 * Every company-scoped collection, in dependency order: items and parties come
 * before the documents that reference them, so an import that is replayed in
 * this order never points at a record that does not exist yet.
 */
const COLLECTIONS = [
  { key: "items", model: ItemModel },
  { key: "parties", model: PartyModel },
  { key: "godowns", model: GodownModel },
  { key: "batches", model: BatchModel },
  { key: "transporters", model: TransporterModel },
  { key: "invoices", model: InvoiceModel },
  { key: "purchaseInvoices", model: PurchaseInvoiceModel },
  { key: "creditNotes", model: CreditNoteModel },
  { key: "debitNotes", model: DebitNoteModel },
  { key: "stockAdjustments", model: StockAdjustmentModel },
  { key: "stockTransfers", model: StockTransferModel },
  { key: "stockLedgers", model: StockLedgerModel },
  { key: "counters", model: CounterModel },
] as const;

export type CollectionKey = (typeof COLLECTIONS)[number]["key"];

export interface CompanyExport {
  format: string;
  version: number;
  exportedAt: string;
  company: Record<string, unknown>;
  data: Record<string, Record<string, unknown>[]>;
  counts: Record<string, number>;
}

/** Serialises one company and everything belonging to it into a plain object. */
export async function exportCompany(companyId: string): Promise<CompanyExport | null> {
  const company = await CompanyModel.findOne({ _id: companyId }).lean();
  if (!company) return null;

  const data: Record<string, Record<string, unknown>[]> = {};
  const counts: Record<string, number> = {};

  for (const { key, model } of COLLECTIONS) {
    const rows = await (model as any).find({ companyId }).lean();
    data[key] = rows;
    counts[key] = rows.length;
  }

  const { _id, ownerId, ...companyFields } = company as Record<string, unknown>;
  void _id;
  void ownerId;

  return {
    format: EXPORT_FORMAT,
    version: EXPORT_VERSION,
    exportedAt: new Date().toISOString(),
    company: companyFields,
    counts,
    data,
  };
}

export interface ImportResult {
  companyId: string;
  counts: Record<string, number>;
}

export class ImportValidationError extends Error {}

/**
 * Recreates an exported company as a brand new company owned by `ownerId`.
 *
 * Nothing existing is ever modified: a fresh company id is minted and every
 * imported row is re-stamped with it, so a malformed or hostile file cannot
 * reach live books. Original `_id`s are dropped and item references are
 * remapped to the newly created items.
 */
export async function importCompany(
  payload: unknown,
  owner: { id: string; email: string; name?: string }
): Promise<ImportResult> {
  const file = payload as Partial<CompanyExport>;

  if (!file || typeof file !== "object") {
    throw new ImportValidationError("The file is not a valid export.");
  }
  if (file.format !== EXPORT_FORMAT) {
    throw new ImportValidationError(
      `Unrecognised file format. Expected "${EXPORT_FORMAT}".`
    );
  }
  if (file.version !== EXPORT_VERSION) {
    throw new ImportValidationError(
      `Unsupported export version ${String(file.version)}. This build reads version ${EXPORT_VERSION}.`
    );
  }
  if (!file.company || typeof file.company !== "object") {
    throw new ImportValidationError("The file has no company profile.");
  }

  const companySource = { ...(file.company as Record<string, unknown>) };
  delete companySource._id;
  delete companySource.ownerId;

  const legalName = String(companySource.legalName ?? "").trim();
  if (!legalName) {
    throw new ImportValidationError("The company profile has no legal name.");
  }

  const tradeName = String(companySource.tradeName ?? "").trim() || legalName;

  const company = await CompanyModel.create({
    ...companySource,
    legalName,
    tradeName,
    ownerId: owner.id,
  });
  const companyId = company._id.toString();

  // The importer owns the restored company.
  await CompanyMemberModel.create({
    companyId,
    userId: owner.id,
    email: owner.email,
    name: owner.name,
    role: "owner",
  });

  // Old item _id -> new item _id, so ledger rows and document lines that
  // reference an item still resolve after the re-insert.
  const itemIdMap = new Map<string, string>();
  const counts: Record<string, number> = {};
  const source = (file.data ?? {}) as Record<string, Record<string, unknown>[]>;

  for (const { key, model } of COLLECTIONS) {
    const rows = Array.isArray(source[key]) ? source[key] : [];
    if (rows.length === 0) {
      counts[key] = 0;
      continue;
    }

    const prepared = rows.map((row) => {
      const next = { ...row };
      const originalId = next._id ? String(next._id) : null;
      delete next._id;
      delete next.__v;
      next.companyId = companyId;

      // Re-point item references at the newly inserted items.
      if (key !== "items" && next.itemId) {
        const mapped = itemIdMap.get(String(next.itemId));
        if (mapped) next.itemId = mapped;
      }
      if (Array.isArray(next.items)) {
        next.items = (next.items as Record<string, unknown>[]).map((line) => {
          const nextLine = { ...line };
          delete nextLine._id;
          if (nextLine.itemId) {
            const mapped = itemIdMap.get(String(nextLine.itemId));
            if (mapped) nextLine.itemId = mapped;
          }
          return nextLine;
        });
      }

      return { originalId, doc: next };
    });

    const inserted = await (model as any).insertMany(
      prepared.map((p) => p.doc),
      { ordered: false }
    );

    if (key === "items") {
      inserted.forEach((doc: { _id: unknown }, index: number) => {
        const originalId = prepared[index].originalId;
        if (originalId) itemIdMap.set(originalId, String(doc._id));
      });
    }

    counts[key] = inserted.length;
  }

  return { companyId, counts };
}
