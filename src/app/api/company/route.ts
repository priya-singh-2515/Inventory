import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { CompanyModel } from "@/lib/models";

export async function GET() {
  try {
    await connectToDatabase();
    let company = await CompanyModel.findOne();
    if (!company) {
      // Default initial company record
      company = await CompanyModel.create({
        gstin: "27AAACG0000A1Z5",
        legalName: "Acme Enterprises India Pvt Ltd",
        tradeName: "Acme Store",
        address1: "Unit 101, Business Park",
        location: "Mumbai",
        pincode: 400001,
        stateCode: "27",
        state: "Maharashtra",
        phone: "9876543210",
        email: "info@acmestore.in",
        bankName: "HDFC Bank",
        bankAccountNo: "50200012345678",
        bankIfsc: "HDFC0000123",
        bankBranch: "Fort Mumbai",
      });
    }
    return NextResponse.json(company);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    await connectToDatabase();
    const body = await req.json();
    const existing = await CompanyModel.findOne();
    let company;
    if (existing) {
      company = await CompanyModel.findByIdAndUpdate(existing._id, body, { new: true });
    } else {
      company = await CompanyModel.create(body);
    }
    return NextResponse.json(company);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
