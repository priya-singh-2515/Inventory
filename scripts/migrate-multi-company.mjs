/**
 * One-off migration to multi-company + role-based access.
 *
 * Before: one implicit company, every document unscoped.
 * After:  every document carries `companyId`, and the existing user owns the
 *         existing company through a CompanyMember row.
 *
 * Safe to run more than once — each step skips work that is already done.
 *
 *   node scripts/migrate-multi-company.mjs          # report only
 *   node scripts/migrate-multi-company.mjs --apply  # make the changes
 */
import { MongoClient } from "mongodb";

const URI = process.env.MONGODB_URI || "mongodb://localhost:27017/invoice-db";
const APPLY = process.argv.includes("--apply");

const SCOPED = [
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
  "deliverychallans",
  "journals",
  "payments",
  "receipts",
];

const client = new MongoClient(URI);
await client.connect();
const db = client.db();

console.log(`${APPLY ? "APPLYING" : "DRY RUN"} — ${URI}\n`);

const companies = await db.collection("companies").find().toArray();
const users = await db.collection("user").find().toArray();

if (companies.length === 0) {
  console.log("No company exists yet. Nothing to migrate — the app will ask you to create one.");
  await client.close();
  process.exit(0);
}
if (users.length === 0) {
  console.log("No user account exists yet. Sign up first, then re-run this migration.");
  await client.close();
  process.exit(1);
}

// The pre-migration app had exactly one company; if several exist, the oldest
// is the one all the unscoped documents belonged to.
const company = companies.sort((a, b) => (a._id > b._id ? 1 : -1))[0];
const owner = users.sort((a, b) => (a.createdAt > b.createdAt ? 1 : -1))[0];
const companyId = company._id.toString();

console.log(`Company : ${company.tradeName || company.legalName} (${companyId})`);
console.log(`Owner   : ${owner.email} (${owner._id})\n`);

// 1. Stamp ownership on the company.
if (!company.ownerId) {
  console.log(`  companies       → set ownerId`);
  if (APPLY) {
    await db.collection("companies").updateOne(
      { _id: company._id },
      { $set: { ownerId: owner._id.toString() } }
    );
  }
} else {
  console.log(`  companies       → ownerId already set, skipping`);
}

// 2. Owner membership.
const existingMember = await db
  .collection("companymembers")
  .findOne({ companyId, userId: owner._id.toString() });
if (!existingMember) {
  console.log(`  companymembers  → create owner membership`);
  if (APPLY) {
    await db.collection("companymembers").insertOne({
      companyId,
      userId: owner._id.toString(),
      email: owner.email,
      name: owner.name,
      role: "owner",
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }
} else {
  console.log(`  companymembers  → owner membership exists, skipping`);
}

// 3. Backfill companyId on every scoped collection.
let totalStamped = 0;
for (const name of SCOPED) {
  const missing = await db.collection(name).countDocuments({ companyId: { $exists: false } });
  if (missing === 0) continue;
  totalStamped += missing;
  console.log(`  ${name.padEnd(16)}→ stamp ${missing} document(s)`);
  if (APPLY) {
    await db.collection(name).updateMany({ companyId: { $exists: false } }, { $set: { companyId } });
  }
}
if (totalStamped === 0) console.log("  (all documents already carry companyId)");

// 4. Replace the old global-unique indexes with per-company ones.
const INDEX_FIXES = [
  ["invoices", "invoiceNumber"],
  ["purchaseinvoices", "purchaseInvoiceNumber"],
  ["stockadjustments", "adjustmentNo"],
  ["stocktransfers", "transferNo"],
  ["counters", "name"],
];
console.log("");
for (const [collection, field] of INDEX_FIXES) {
  const indexes = await db.collection(collection).indexes().catch(() => []);
  const stale = indexes.find(
    (i) => i.unique && Object.keys(i.key).length === 1 && i.key[field] === 1
  );
  if (!stale) continue;
  console.log(`  ${collection}: drop global-unique index "${stale.name}" on ${field}`);
  console.log(`     (a second company would otherwise fail to create its own ${field})`);
  if (APPLY) {
    await db.collection(collection).dropIndex(stale.name);
  }
}

console.log(
  APPLY
    ? "\nDone. Restart the dev server so Mongoose rebuilds its indexes."
    : "\nDry run only — nothing was changed. Re-run with --apply to migrate."
);

await client.close();
