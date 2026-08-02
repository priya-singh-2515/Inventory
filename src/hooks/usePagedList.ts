"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export interface PagedResponse<T> {
  data: T[];
  nextCursor: string | null;
  hasMore: boolean;
  limit: number;
}

interface Options {
  /** Endpoint without paging params, e.g. "/api/invoices". */
  endpoint: string;
  /** Extra query params that are part of the query identity. */
  params?: Record<string, string | undefined>;
  /** Cursor query key — items page by name, documents by _id. */
  cursorParam?: "cursor" | "after";
  pageSize?: number;
}

/**
 * Loads a cursor-paginated endpoint with server-side search.
 *
 * Search is debounced and sent to the server rather than filtering an
 * already-loaded array, because at scale the client never holds the whole
 * collection — that is the entire point of paging it.
 */
export function usePagedList<T>({
  endpoint,
  params,
  cursorParam = "cursor",
  pageSize = 50,
}: Options) {
  const [rows, setRows] = useState<T[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const cursorRef = useRef<string | null>(null);
  // Guards against a slow first page overwriting a newer search's results.
  const requestIdRef = useRef(0);

  const paramKey = JSON.stringify(params ?? {});

  const fetchPage = useCallback(
    async (mode: "reset" | "more") => {
      const requestId = ++requestIdRef.current;
      if (mode === "reset") {
        setLoading(true);
        cursorRef.current = null;
      } else {
        setLoadingMore(true);
      }

      try {
        const query = new URLSearchParams({ limit: String(pageSize) });
        if (search) query.set("q", search);
        if (mode === "more" && cursorRef.current) {
          query.set(cursorParam, cursorRef.current);
        }
        for (const [key, value] of Object.entries(JSON.parse(paramKey) as Record<string, string>)) {
          if (value) query.set(key, value);
        }

        const res = await fetch(`${endpoint}?${query.toString()}`);
        if (!res.ok) throw new Error(`Request failed (${res.status})`);

        const payload: PagedResponse<T> = await res.json();
        // A stale response from a superseded search must not land.
        if (requestId !== requestIdRef.current) return;

        setRows((prev) => (mode === "reset" ? payload.data : [...prev, ...payload.data]));
        cursorRef.current = payload.nextCursor;
        setHasMore(payload.hasMore);
        setError(null);
      } catch (e) {
        if (requestId !== requestIdRef.current) return;
        console.error(`Failed to load ${endpoint}`, e);
        setError(e instanceof Error ? e.message : "Failed to load");
      } finally {
        if (requestId === requestIdRef.current) {
          setLoading(false);
          setLoadingMore(false);
        }
      }
    },
    [endpoint, paramKey, cursorParam, pageSize, search]
  );

  // Debounced so typing does not fire a request per keystroke.
  useEffect(() => {
    const id = setTimeout(() => fetchPage("reset"), search ? 250 : 0);
    return () => clearTimeout(id);
  }, [fetchPage, search]);

  return {
    rows,
    search,
    setSearch,
    loading,
    loadingMore,
    hasMore,
    error,
    loadMore: () => fetchPage("more"),
    reload: () => fetchPage("reset"),
  };
}
