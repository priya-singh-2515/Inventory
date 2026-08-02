/*
 * One-off migration to multi-company.
 *
 * Before this change there was a single implicit company and no tenancy key.
 * This assigns the existing company to a user (making it their first company)
 * and stamps every orphaned business document with that company's id, so data
 * created before the change stays visible afterwards.
 *
 * Safe to run more than once: it only touches documents that have no companyId.
 *
 *   node scripts/migrate-multi-company.js            # report only
 *   node scripts/migrate-multi-company.js --apply    # write changes
 */
const { MongoClient } = require("mongodb");

const URI = process.env.MONGODB_URI || "mongodb://localhost:27017/invoice-db";
const APPLY = process.argv.includes("--apply");

const TENANT_COLLECTIONS = [
  "invoices",
  "purchaseinvoices",
  "items",
  "parties",
  "creditnotes",
  "debitnotes",
  "stockadjustments",
  "stocktransfers",
  "stockledgers",
  "godowns",
  "batches",
  "transporters",
  "counters",
  "journals",
  "payments",
  "receipts",
  "deliverychallans",
];

async function main() {
  const client = new MongoClient(URI);
  await client.connect();
  const db = client.db();

  const users = await db.collection("user").find({}).sort({ createdAt: 1 }).toArray();
  if (users.length === 0) {
    console.error("No users exist. Sign up first, then re-run this migration.");
    process.exitCode = 1;
    await client.close();
    return;
  }

  const owner = users[0];
  console.log(`Owner for existing data: ${owner.email} (${owner._id})`);
  if (users.length > 1) {
    console.log(`  note: ${users.length} users exist; the oldest is used as owner.`);
  }

  const companies = await db.collection("companies").find({}).toArray();
  if (companies.length === 0) {
    console.error("No company record found — nothing to migrate onto.");
    await client.close();
    return;
  }
  if (companies.length > 1) {
    console.log(`  note: ${companies.length} companies exist; the oldest takes the orphans.`);
  }

  const company = companies[0];
  const companyId = company._id.toString();
  console.log(`Target company: ${company.tradeName || company.legalName} (${companyId})`);

  const needsOwner = companies.filter((c) => !c.ownerId).length;
  console.log(`\ncompanies missing ownerId: ${needsOwner}`);

  let orphanTotal = 0;
  const plan = [];
  for (const name of TENANT_COLLECTIONS) {
    const count = await db.collection(name).countDocuments({ companyId: { $exists: false } });
    if (count > 0) {
      plan.push({ name, count });
      orphanTotal += count;
    }
  }

  console.log("documents missing companyId:");
  if (plan.length === 0) console.log("  (none)");
  for (const { name, count } of plan) console.log(`  ${name}: ${count}`);
  console.log(`  total: ${orphanTotal}`);

  if (!APPLY) {
    console.log("\nDry run. Re-run with --apply to write these changes.");
    await client.close();
    return;
  }

  if (needsOwner > 0) {
    const r = await db
      .collection("companies")
      .updateMany({ ownerId: { $exists: false } }, { $set: { ownerId: owner._id.toString() } });
    console.log(`\nstamped ownerId on ${r.modifiedCount} companies`);
  }

  for (const { name } of plan) {
    const r = await db
      .collection(name)
      .updateMany({ companyId: { $exists: false } }, { $set: { companyId } });
    console.log(`  ${name}: stamped ${r.modifiedCount}`);
  }

  // The old schema had globally-unique indexes on document numbers and counter
  // names. Those now conflict with per-company numbering, so drop them and let
  // Mongoose rebuild the compound versions on next connect.
  const legacy = [
    ["invoices", "invoiceNumber_1"],
    ["purchaseinvoices", "purchaseInvoiceNumber_1"],
    ["stockadjustments", "adjustmentNo_1"],
    ["stocktransfers", "transferNo_1"],
    ["counters", "name_1"],
  ];
  console.log("\ndropping legacy global-unique indexes:");
  for (const [collection, index] of legacy) {
    try {
      await db.collection(collection).dropIndex(index);
      console.log(`  dropped ${collection}.${index}`);
    } catch (e) {
      if (e.codeName === "IndexNotFound" || e.code === 27) {
        console.log(`  ${collection}.${index} (already absent)`);
      } else {
        throw e;
      }
    }
  }

  console.log("\nMigration complete.");
  await client.close();
}

main().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
