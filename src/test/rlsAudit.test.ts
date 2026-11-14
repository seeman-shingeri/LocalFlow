import { describe, it, expect } from 'vitest';
import {
  auditWorkspaceBoundary,
  verifyTenantMembership,
  validatePayloadWorkspace,
  auditSchemaRlsPolicies,
} from '@/lib/rlsAudit';
import fs from 'fs';
import path from 'path';

describe('Enterprise Row Level Security (RLS) & Multi-Tenant Audit (rlsAudit)', () => {
  it('enforces strict tenant boundary isolation between workspaces', () => {
    const valid = auditWorkspaceBoundary('ws-alpha', 'ws-alpha', 'customer');
    expect(valid.authorized).toBe(true);

    const crossTenantAttempt = auditWorkspaceBoundary('ws-alpha', 'ws-beta', 'invoice');
    expect(crossTenantAttempt.authorized).toBe(false);
    expect(crossTenantAttempt.reason).toContain('Tenant Boundary Violation');
  });

  it('verifies user workspace membership authorization', () => {
    const userContext = {
      userId: 'usr-1',
      memberWorkspaceIds: ['ws-1', 'ws-2'],
    };

    expect(verifyTenantMembership(userContext, 'ws-1')).toBe(true);
    expect(verifyTenantMembership(userContext, 'ws-unauthorized')).toBe(false);
  });

  it('validates mutation payloads for mandatory workspace_id property', () => {
    const compliant = validatePayloadWorkspace({ workspace_id: 'ws-10', name: 'Ravi' }, 'ws-10');
    expect(compliant.isValid).toBe(true);

    const missingWorkspace = validatePayloadWorkspace({ name: 'Ravi' }, 'ws-10');
    expect(missingWorkspace.isValid).toBe(false);
    expect(missingWorkspace.error).toContain('missing mandatory workspace_id');

    const mismatchedWorkspace = validatePayloadWorkspace(
      { workspace_id: 'ws-attacker', name: 'Ravi' },
      'ws-10'
    );
    expect(mismatchedWorkspace.isValid).toBe(false);
    expect(mismatchedWorkspace.error).toContain('Workspace ID mismatch');
  });

  it('audits actual Supabase schema migration DDL to ensure all core tables have RLS enabled and policies defined', () => {
    const schemaPath = path.resolve(
      __dirname,
      '../../supabase/migrations/20250101000000_localflow_schema.sql'
    );
    const ddlSql = fs.readFileSync(schemaPath, 'utf8');

    const audit = auditSchemaRlsPolicies(ddlSql, [
      'customers',
      'enquiries',
      'follow_ups',
      'appointments',
      'invoices',
      'payments',
    ]);

    expect(audit.totalAuditedTables).toBe(6);
    expect(audit.compliantCount).toBe(6);
    expect(audit.allCompliant).toBe(true);

    // Ensure no insecure wildcards
    expect(audit.tables.customers.hasInsecureBypass).toBe(false);
    expect(audit.tables.invoices.hasInsecureBypass).toBe(false);
  });
});
