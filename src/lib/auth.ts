import { betterAuth } from "better-auth";
import { mongodbAdapter } from "better-auth/adapters/mongodb";
import { MongoClient } from "mongodb";

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/invoice-db";

if (process.env.NODE_ENV === "production" && !process.env.BETTER_AUTH_SECRET) {
  throw new Error(
    "BETTER_AUTH_SECRET is not set. Generate one with `openssl rand -base64 32`."
  );
}

// Better Auth needs a raw MongoDB `Db`, not a Mongoose connection, so it opens
// its own client against the same database. MongoClient connects lazily on the
// first operation, which is why `client.db()` is safe to call at module scope.
declare global {
  var betterAuthMongoClient: MongoClient | undefined;
}

const client = global.betterAuthMongoClient ?? new MongoClient(MONGODB_URI);

// Cache on globalThis so Next.js hot reloads reuse one connection pool instead
// of leaking a new one on every recompile — same rationale as lib/mongodb.ts.
if (!global.betterAuthMongoClient) {
  global.betterAuthMongoClient = client;
}

// MongoDB transactions require a replica set or mongos — a standalone `mongod`
// rejects them outright, which breaks sign-up. Off by default so any deployment
// works; set MONGODB_TRANSACTIONS=true on a replica set (Atlas always is) to
// make Better Auth's multi-step writes atomic.
const useTransactions = process.env.MONGODB_TRANSACTIONS === "true";

export const auth = betterAuth({
  database: mongodbAdapter(client.db(), { client, transaction: useTransactions }),
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 8,
  },
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24, // refresh the expiry once a day
  },
});

export type Session = typeof auth.$Infer.Session;
