import { ItemModel, StockLedgerModel } from "@/lib/models";
import { TransactionType } from "@/lib/types/inventory";

export interface StockMovementInput {
  companyId: string;
  itemId: string;
  itemName: string;
  transactionType: TransactionType;
  referenceId: string;
  qtyIn: number;
  qtyOut: number;
  godown?: string;
  batch?: string;
  rate?: number;
  narration?: string;
  date?: string;
}

export async function processStockMovement(movement: StockMovementInput): Promise<number> {
  // Scoped lookup: an item id from another company must not resolve.
  const item = await ItemModel.findOne({ _id: movement.itemId, companyId: movement.companyId });
  if (!item) {
    throw new Error(`Item not found for stock update: ${movement.itemId}`);
  }

  // Only Products have stock tracking
  if (item.type === "Service") {
    return 0;
  }

  const currentStock = Number(item.stock) || 0;
  const qtyIn = Number(movement.qtyIn) || 0;
  const qtyOut = Number(movement.qtyOut) || 0;
  const netDelta = qtyIn - qtyOut;

  const newBalance = currentStock + netDelta;
  item.stock = newBalance;
  item.isLowStock = item.minStock > 0 ? newBalance <= item.minStock : false;
  await item.save();

  // Create immutable StockLedger record
  await StockLedgerModel.create({
    companyId: movement.companyId,
    date: movement.date ? new Date(movement.date) : new Date(),
    itemId: item._id,
    itemName: item.name,
    transactionType: movement.transactionType,
    referenceId: movement.referenceId,
    godown: movement.godown || item.location,
    batch: movement.batch,
    qtyIn,
    qtyOut,
    balanceStock: newBalance,
    rate: movement.rate || item.sellingRate,
    narration: movement.narration,
  });

  return newBalance;
}

export async function revertStockMovement(
  companyId: string,
  referenceId: string,
  transactionType: TransactionType
): Promise<void> {
  // Find all stock ledger records for this transaction reference
  const ledgers = await StockLedgerModel.find({ companyId, referenceId, transactionType });

  for (const ledger of ledgers) {
    const item = await ItemModel.findOne({ _id: ledger.itemId, companyId });
    if (item && item.type === "Product") {
      // Inverse the delta: subtract qtyIn that was added, add back qtyOut that was removed
      const reverseDelta = ledger.qtyOut - ledger.qtyIn;
      const updatedStock = (item.stock || 0) + reverseDelta;
      item.stock = updatedStock;
      item.isLowStock = item.minStock > 0 ? updatedStock <= item.minStock : false;
      await item.save();
    }
  }

  // Remove the old ledger records
  await StockLedgerModel.deleteMany({ companyId, referenceId, transactionType });
}
