import { NextResponse } from "next/server";
import { requirePermission } from "@/lib/company-context";
import { connectToDatabase } from "@/lib/mongodb";
import { paginate, readPageRequest, searchFilter } from "@/lib/pagination";
import { PurchaseInvoiceModel, ItemModel, CompanyModel } from "@/lib/models";
import { calculateInvoiceTaxes } from "@/lib/services/invoice-calculator";
import { processStockMovement } from "@/lib/services/stock-engine-service";
import { getNextCounterValue } from "@/lib/utils/counter-utils";

export async function GET(req: Request) {
  try {
    await connectToDatabase();
    const ctx = await requirePermission(req, "purchases", "view");
    if (!ctx.ok) return ctx.response;
    const { companyId } = ctx.context;
    const page = readPageRequest(req);
    const result = await paginate(PurchaseInvoiceModel, {
      companyId,
      ...searchFilter(page.search, [
        "purchaseInvoiceNumber",
        "supplierInvoiceNo",
        "supplierName",
        "supplierGstin",
        "supplierState",
      ]),
    }, page);
    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    await connectToDatabase();
    const ctx = await requirePermission(req, "purchases", "manage");
    if (!ctx.ok) return ctx.response;
    const { companyId } = ctx.context;
    const body = await req.json();

    // Loaded first: it supplies both the numbering prefix and the home state.
    const company = await CompanyModel.findOne({ _id: companyId });
    const companyState = company?.state || "Maharashtra";

    let purchaseInvoiceNumber = body.purchaseInvoiceNumber;
    if (!purchaseInvoiceNumber) {
      purchaseInvoiceNumber = await getNextCounterValue(
        companyId,
        "purchase-invoice",
        company?.purchasePrefix || "PUR"
      );
    }

    const calcResult = calculateInvoiceTaxes(
      body.items || [],
      body.supplierState || companyState,
      companyState
    );

    const newPurchase = await PurchaseInvoiceModel.create({
      ...body,
      companyId,
      purchaseInvoiceNumber,
      items: calcResult.items,
      totalTaxable: calcResult.totalTaxable,
      totalTax: calcResult.totalTax,
      totalAmount: calcResult.grandTotal,
    });

    // Process Stock Movement: Add inventory stock (+ qtyIn)
    if (newPurchase.status !== "Cancelled") {
      for (const item of newPurchase.items) {
        if (item.type === "Product") {
          let dbItem = await ItemModel.findOne({ companyId, name: item.name });
          if (!dbItem) {
            // Auto-create item if missing
            dbItem = await ItemModel.create({
              name: item.name,
              type: "Product",
              hsnCode: item.hsnCode,
              unit: item.unit || "NOS",
              sellingRate: item.rate,
              purchaseRate: item.rate,
              stock: 0,
              taxRate: item.taxRate,
              taxType: item.taxType,
            });
          }

          await processStockMovement({
            companyId,
            itemId: dbItem._id.toString(),
            itemName: dbItem.name,
            transactionType: "Purchase Invoice",
            referenceId: newPurchase.purchaseInvoiceNumber,
            qtyIn: item.qty,
            qtyOut: 0,
            godown: item.godown || dbItem.location,
            batch: item.batch,
            rate: item.rate,
            date: newPurchase.date,
            narration: `Purchase from ${newPurchase.supplierName}`,
          });
        }
      }
    }

    return NextResponse.json(newPurchase, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
