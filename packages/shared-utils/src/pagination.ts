// ============================================================================
// @piums/shared-utils — Pagination helpers
// ============================================================================

export interface ParsedPagination {
  page: number;
  limit: number;
  skip: number;
}

export function parsePagination(
  query: Record<string, unknown>,
  defaults = { page: 1, limit: 20, maxLimit: 100 },
): ParsedPagination {
  const page = Math.max(1, parseInt(String(query['page'] ?? defaults.page), 10) || defaults.page);
  const rawLimit = parseInt(String(query['limit'] ?? defaults.limit), 10) || defaults.limit;
  const limit = Math.min(Math.max(1, rawLimit), defaults.maxLimit);
  return { page, limit, skip: (page - 1) * limit };
}

export function buildPaginationMeta(total: number, page: number, limit: number) {
  const totalPages = Math.ceil(total / limit);
  return {
    total,
    page,
    limit,
    totalPages,
    hasNextPage: page < totalPages,
    hasPreviousPage: page > 1,
  };
}
