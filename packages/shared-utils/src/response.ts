// ============================================================================
// @piums/shared-utils — Express response helpers
// ============================================================================

import type { Response } from 'express';

export function jsonSuccess<T>(res: Response, data: T, statusCode = 200): Response {
  return res.status(statusCode).json({ status: 'success', data });
}

export function jsonCreated<T>(res: Response, data: T): Response {
  return jsonSuccess(res, data, 201);
}

export function jsonNoContent(res: Response): Response {
  return res.status(204).send();
}

export function jsonError(res: Response, message: string, statusCode = 500): Response {
  return res.status(statusCode).json({ status: 'error', message });
}

export interface PaginatedData<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
}

export function jsonPaginated<T>(res: Response, { items, total, page, limit }: PaginatedData<T>): Response {
  const totalPages = Math.ceil(total / limit);
  return res.status(200).json({
    status: 'success',
    data: items,
    pagination: {
      total,
      page,
      limit,
      totalPages,
      hasNextPage: page < totalPages,
      hasPreviousPage: page > 1,
    },
  });
}
