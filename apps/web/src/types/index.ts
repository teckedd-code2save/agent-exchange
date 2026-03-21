export type { ServiceWithRelations, ServiceListItem, PaginatedResult, SearchResult } from '@agent-exchange/db';

export interface ApiError {
  type: string;
  title: string;
  status: number;
  detail: string;
}

export function problemDetails(
  status: number,
  title: string,
  detail: string,
  extra?: Record<string, unknown>,
): Response {
  return Response.json(
    {
      type: `https://agentexchange.dev/problems/${title.toLowerCase().replace(/\s+/g, '-')}`,
      title,
      status,
      detail,
      ...extra,
    },
    {
      status,
      headers: { 'Content-Type': 'application/problem+json' },
    },
  );
}
