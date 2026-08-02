import { NextResponse } from "next/server";
import { requirePermission } from "@/lib/company-context";
import { connectToDatabase } from "@/lib/mongodb";
import { paginate, readPageRequest, searchFilter } from "@/lib/pagination";
import { InvoiceModel, ItemModel, CompanyModel } from "@/lib/models";
import { calculateInvoiceTaxes } from "@/lib/services/invoice-calculator";
import { processStockMovement } from "@/lib/services/stock-engine-service";
import { getNextCounterValue } from "@/lib/utils/counter-utils";

export async function GET(req: Request) {
  try {
    await connectToDatabase();
    const ctx = await requirePermission(req, "sales", "view");
    if (!ctx.ok) return ctx.response;
    const { companyId } = ctx.context;
    const page = readPageRequest(req);
    const result = await paginate(InvoiceModel, {
      companyId,
      ...searchFilter(page.search, ["invoiceNumber", "partyName", "partyGstin", "partyState"]),
    }, page);
    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    await connectToDatabase();
    const ctx = await requirePermission(req, "sales", "manage");
    if (!ctx.ok) return ctx.response;
    const { companyId } = ctx.context;
    const body = await req.json();

    // Loaded first: it supplies both the numbering prefix and the home state.
    const company = await CompanyModel.findOne({ _id: companyId });
    const companyState = company?.state || "Maharashtra";

    let invoiceNumber = body.invoiceNumber;
    if (!invoiceNumber) {
      invoiceNumber = await getNextCounterValue(
        companyId,
        "sales-invoice",
        company?.invoicePrefix || "INV"
      );
    }

    const calcResult = calculateInvoiceTaxes(
      body.items || [],
      body.partyState || companyState,
      companyState
    );

    const newInvoice = await InvoiceModel.create({
      ...body,
      companyId,
      invoiceNumber,
      items: calcResult.items,
      totalTaxable: calcResult.totalTaxable,
      totalTax: calcResult.totalTax,
      totalAmount: calcResult.grandTotal,
      roundOff: calcResult.roundOff,
    });

    // Update stock levels & record stock ledger audit for each product item
    if (newInvoice.status !== "Cancelled") {
      for (const item of newInvoice.items) {
        if (item.type === "Product") {
          const dbItem = await ItemModel.findOne({ companyId, name: item.name });
          if (dbItem) {
            await processStockMovement({
              companyId,
              itemId: dbItem._id.toString(),
              itemName: dbItem.name,
              transactionType: "Sales Invoice",
              referenceId: newInvoice.invoiceNumber,
              qtyIn: 0,
              qtyOut: item.qty,
              godown: item.godown || dbItem.location,
              batch: item.batch,
              rate: item.rate,
              date: newInvoice.date,
              narration: `Sale to ${newInvoice.partyName}`,
            });
          }
        }
      }
    }

    return NextResponse.json(newInvoice, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
