import { z } from 'zod';
import { PAGE_DEFAULT, PAGE_SIZE_DEFAULT, PAGE_SIZE_MAX, SORT_DIRECTIONS } from '../constants';

export const paginationQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(PAGE_DEFAULT),
  limit: z.coerce.number().int().min(1).max(PAGE_SIZE_MAX).default(PAGE_SIZE_DEFAULT),
  sort: z.string().trim().min(1).max(32).optional(),
  order: z.enum(SORT_DIRECTIONS).default('desc'),
  search: z.string().trim().max(120).optional(),
});

export type PaginationQuery = z.infer<typeof paginationQuerySchema>;

export type PaginationMeta = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};
