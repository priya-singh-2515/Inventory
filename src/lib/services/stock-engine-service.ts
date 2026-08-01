import { ItemModel, StockLedgerModel } from "@/lib/models";
import { TransactionType } from "@/lib/types/inventory";

export interface StockMovementInput {
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
  const item = await ItemModel.findById(movement.itemId);
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
  referenceId: string,
  transactionType: TransactionType
): Promise<void> {
  // Find all stock ledger records for this transaction reference
  const ledgers = await StockLedgerModel.find({ referenceId, transactionType });

  for (const ledger of ledgers) {
    const item = await ItemModel.findById(ledger.itemId);
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
  await StockLedgerModel.deleteMany({ referenceId, transactionType });
}
