import { Types } from "mongoose";

/**
 * Keyset (cursor) pagination.
 *
 * Deliberately not skip/limit: `skip` makes the database walk and discard every
 * preceding document, so page 10,000 costs 10,000 pages of work. Keyset paging
 * seeks straight to the cursor via the index, so page 10,000 costs the same as
 * page 1 — which is the whole point at millions of rows.
 *
 * `_id` is the cursor. ObjectIds embed a timestamp and are unique, so sorting
 * by `_id` descending gives newest-first ordering that is stable even while
 * rows are being inserted — a `createdAt` sort can tie and silently repeat or
 * skip rows between pages.
 */

export const DEFAULT_PAGE_SIZE = 50;
export const MAX_PAGE_SIZE = 200;

export interface PageRequest {
  limit: number;
  cursor: string | null;
  search: string;
}

export interface PageResponse<T> {
  data: T[];
  nextCursor: string | null;
  hasMore: boolean;
  /** Echoed back so a client can confirm what it actually got. */
  limit: number;
}

/** Reads and clamps the paging parameters from a request URL. */
export function readPageRequest(req: Request): PageRequest {
  const { searchParams } = new URL(req.url);

  const requested = Number(searchParams.get("limit"));
  const limit = Number.isFinite(requested) && requested > 0
    ? Math.min(Math.trunc(requested), MAX_PAGE_SIZE)
    : DEFAULT_PAGE_SIZE;

  const rawCursor = searchParams.get("cursor");
  // An unparseable cursor would otherwise throw deep inside the driver.
  const cursor = rawCursor && Types.ObjectId.isValid(rawCursor) ? rawCursor : null;

  return { limit, cursor, search: (searchParams.get("q") ?? "").trim() };
}

/** The `_id` clause that seeks past the previous page. */
export function cursorFilter(cursor: string | null): Record<string, unknown> {
  return cursor ? { _id: { $lt: new Types.ObjectId(cursor) } } : {};
}

/**
 * Case-insensitive "starts with" match across the given fields.
 *
 * Anchored on purpose: `^term` can be served from an index, whereas an
 * unanchored `/term/` forces a full collection scan — the exact thing this
 * module exists to avoid. Substring search across millions of rows needs a
 * real text index (or Atlas Search); see the README.
 */
export function searchFilter(search: string, fields: string[]): Record<string, unknown> {
  if (!search) return {};
  const escaped = search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const prefix = new RegExp(`^${escaped}`, "i");
  return { $or: fields.map((field) => ({ [field]: prefix })) };
}

/**
 * Runs the query one row over the limit to learn whether another page exists
 * without paying for a count.
 */
export async function paginate<T extends { _id: unknown }>(
  model: { find: (filter: Record<string, unknown>) => any },
  filter: Record<string, unknown>,
  { limit, cursor }: Pick<PageRequest, "limit" | "cursor">
): Promise<PageResponse<T>> {
  const rows: T[] = await model
    .find({ ...filter, ...cursorFilter(cursor) })
    .sort({ _id: -1 })
    .limit(limit + 1)
    .lean();

  const hasMore = rows.length > limit;
  const data = hasMore ? rows.slice(0, limit) : rows;

  return {
    data,
    hasMore,
    nextCursor: hasMore && data.length ? String(data[data.length - 1]._id) : null,
    limit,
  };
}
