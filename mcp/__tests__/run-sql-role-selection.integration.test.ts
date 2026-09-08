import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { ToolHandlerExtraParams } from '../tools/types';

const serverless = vi.hoisted(() => {
  const query = vi.fn().mockResolvedValue([{ ok: true }]);
  const transaction = vi.fn().mockResolvedValue([[{ ok: true }]]);
  const neon = vi.fn(() => ({ query, transaction }));

  return { neon, query, transaction };
});

vi.mock('@neondatabase/serverless', () => ({
  neon: serverless.neon,
}));

import { NEON_HANDLERS } from '../tools/tools';

function makeNeonClient() {
  return {
    getProjectBranchDatabase: vi.fn().mockResolvedValue({
      data: { database: { owner_name: 'neondb_owner' } },
    }),
    getConnectionUri: vi.fn().mockResolvedValue({
      data: { uri: 'postgresql://example' },
    }),
  };
}

const extra = { readOnly: false } as ToolHandlerExtraParams;

describe('role-targeted SQL handler propagation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('propagates role_name and compute_id through run_sql', async () => {
    const neonClient = makeNeonClient();

    await NEON_HANDLERS.run_sql(
      {
        params: {
          sql: 'SELECT 1',
          project_id: 'project-1',
          branch_id: 'branch-1',
          database_name: 'neondb',
          role_name: 'receipt_writer',
          compute_id: 'ep-target',
        },
      },
      neonClient as unknown as Parameters<typeof NEON_HANDLERS.run_sql>[1],
      extra,
    );

    expect(neonClient.getConnectionUri).toHaveBeenCalledWith(
      expect.objectContaining({
        projectId: 'project-1',
        branch_id: 'branch-1',
        database_name: 'neondb',
        role_name: 'receipt_writer',
        endpoint_id: 'ep-target',
      }),
    );
  });

  it('propagates role_name and compute_id through run_sql_transaction', async () => {
    const neonClient = makeNeonClient();

    await NEON_HANDLERS.run_sql_transaction(
      {
        params: {
          sql_statements: ['SELECT 1', 'SELECT 2'],
          project_id: 'project-1',
          branch_id: 'branch-1',
          database_name: 'neondb',
          role_name: 'receipt_writer',
          compute_id: 'ep-target',
        },
      },
      neonClient as unknown as Parameters<
        typeof NEON_HANDLERS.run_sql_transaction
      >[1],
      extra,
    );

    expect(neonClient.getConnectionUri).toHaveBeenCalledWith(
      expect.objectContaining({
        projectId: 'project-1',
        branch_id: 'branch-1',
        database_name: 'neondb',
        role_name: 'receipt_writer',
        endpoint_id: 'ep-target',
      }),
    );
  });
});
