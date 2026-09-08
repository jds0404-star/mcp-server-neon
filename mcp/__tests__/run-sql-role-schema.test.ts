import { describe, expect, it } from 'vitest';
import { z } from 'zod/v3';
import { HOST_TOOLS } from '../tools/definitions';

function sqlTool(name: 'run_sql' | 'run_sql_transaction') {
  const tool = HOST_TOOLS.find((candidate) => candidate.name === name);
  expect(tool).toBeDefined();
  if (!(tool?.inputSchema instanceof z.ZodObject)) {
    throw new Error(`${name} must keep a Zod 3 object schema`);
  }
  return tool.inputSchema;
}

describe('SQL role/compute selectors', () => {
  it('accepts non-empty role_name and compute_id on both SQL tools', () => {
    expect(
      sqlTool('run_sql').safeParse({
        sql: 'select 1',
        project_id: 'proj-1',
        role_name: 'restricted_writer',
        compute_id: 'ep-test',
      }).success,
    ).toBe(true);

    expect(
      sqlTool('run_sql_transaction').safeParse({
        sql_statements: ['select 1'],
        project_id: 'proj-1',
        role_name: 'restricted_writer',
        compute_id: 'ep-test',
      }).success,
    ).toBe(true);
  });

  it('rejects empty selector values', () => {
    expect(
      sqlTool('run_sql').safeParse({
        sql: 'select 1',
        project_id: 'proj-1',
        role_name: '',
      }).success,
    ).toBe(false);

    expect(
      sqlTool('run_sql_transaction').safeParse({
        sql_statements: ['select 1'],
        project_id: 'proj-1',
        compute_id: '',
      }).success,
    ).toBe(false);
  });

  it('keeps strict snake_case public argument names', () => {
    expect(
      sqlTool('run_sql').safeParse({
        sql: 'select 1',
        project_id: 'proj-1',
        roleName: 'restricted_writer',
      }).success,
    ).toBe(false);

    expect(
      sqlTool('run_sql_transaction').safeParse({
        sql_statements: ['select 1'],
        project_id: 'proj-1',
        computeId: 'ep-test',
      }).success,
    ).toBe(false);
  });
});
