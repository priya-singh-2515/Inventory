import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { InvoiceModel, ItemModel, CompanyModel } from "@/lib/models";
import { calculateInvoiceTaxes } from "@/lib/services/invoice-calculator";
import { processStockMovement } from "@/lib/services/stock-engine-service";
import { getNextCounterValue } from "@/lib/utils/counter-utils";

export async function GET() {
  try {
    await connectToDatabase();
    const invoices = await InvoiceModel.find().sort({ createdAt: -1 });
    return NextResponse.json(invoices);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    await connectToDatabase();
    const body = await req.json();

    let invoiceNumber = body.invoiceNumber;
    if (!invoiceNumber) {
      invoiceNumber = await getNextCounterValue("sales-invoice", "INV");
    }

    const company = await CompanyModel.findOne();
    const companyState = company?.state || "Maharashtra";

    const calcResult = calculateInvoiceTaxes(
      body.items || [],
      body.partyState || companyState,
      companyState
    );

    const newInvoice = await InvoiceModel.create({
      ...body,
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
          const dbItem = await ItemModel.findOne({ name: item.name });
          if (dbItem) {
            await processStockMovement({
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
