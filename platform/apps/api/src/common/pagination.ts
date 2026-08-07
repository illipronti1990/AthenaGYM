export type PageParams = {
  page?: number;
  pageSize?: number;
  maxPageSize?: number;
};

export type PageResultMeta = {
  page: number;
  pageSize: number;
  from: number;
  to: number;
};

/** Canonical pagination: page >= 1, pageSize clamped to [1, max]. */
export function paginate(params: PageParams = {}): PageResultMeta {
  const max = Math.min(Math.max(params.maxPageSize || 200, 1), 500);
  const page = Math.max(1, Number(params.page) || 1);
  const pageSize = Math.min(max, Math.max(1, Number(params.pageSize) || 50));
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;
  return { page, pageSize, from, to };
}

export function pageResponse<T>(
  items: T[],
  total: number,
  meta: PageResultMeta,
): { items: T[]; total: number; page: number; pageSize: number } {
  return {
    items,
    total,
    page: meta.page,
    pageSize: meta.pageSize,
  };
}
