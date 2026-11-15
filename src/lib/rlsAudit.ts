/**
 * Enterprise Row Level Security (RLS) & Multi-Tenant Isolation Audit
 * Verifies strict tenant boundaries, payload workspace integrity, and static DDL RLS compliance.
 */

export interface TenantAccessContext {
  userId: string;
  memberWorkspaceIds: string[];
}

export interface RlsTableAuditResult {
  tableName: string;
  rlsEnabled: boolean;
  hasSelectPolicy: boolean;
  hasInsertPolicy: boolean;
  hasUpdatePolicy: boolean;
  hasDeletePolicy: boolean;
  hasInsecureBypass: boolean;
  isCompliant: boolean;
  warnings: string[];
}

export interface RlsAuditReport {
  compliantCount: number;
  totalAuditedTables: number;
  tables: Record<string, RlsTableAuditResult>;
  allCompliant: boolean;
}

/**
 * Validates that an operation attempting to access or modify a resource belongs to the authorized workspace.
 * Throws an explicit error if a cross-tenant data leak is attempted.
 */
export function auditWorkspaceBoundary(
  targetWorkspaceId: string,
  resourceWorkspaceId: string,
  resourceName: string = 'record'
): { authorized: boolean; reason?: string } {
  if (!targetWorkspaceId || !resourceWorkspaceId) {
    return {
      authorized: false,
      reason: `Missing workspace identifier for ${resourceName}. Both target and resource workspace IDs are required.`,
    };
  }

  if (targetWorkspaceId !== resourceWorkspaceId) {
    return {
      authorized: false,
      reason: `Tenant Boundary Violation: Attempted to access ${resourceName} in workspace ${resourceWorkspaceId} using context ${targetWorkspaceId}.`,
    };
  }

  return { authorized: true };
}

/**
 * Validates that a user context has membership access to the requested workspace.
 */
export function verifyTenantMembership(
  context: TenantAccessContext,
  targetWorkspaceId: string
): boolean {
  if (!context || !targetWorkspaceId) return false;
  return context.memberWorkspaceIds.includes(targetWorkspaceId);
}

/**
 * Validates that an insert/update payload contains a valid workspace_id matching the active workspace.
 */
export function validatePayloadWorkspace<T extends { workspace_id?: string; [key: string]: any }>(
  payload: T,
  expectedWorkspaceId: string
): { isValid: boolean; error?: string } {
  if (!payload || typeof payload !== 'object') {
    return { isValid: false, error: 'Payload must be a valid object.' };
  }

  if (!payload.workspace_id) {
    return { isValid: false, error: 'Payload is missing mandatory workspace_id property.' };
  }

  if (payload.workspace_id !== expectedWorkspaceId) {
    return {
      isValid: false,
      error: `Workspace ID mismatch: payload specifies ${payload.workspace_id}, but active workspace is ${expectedWorkspaceId}.`,
    };
  }

  return { isValid: true };
}

/**
 * Statically parses PostgreSQL schema DDL to audit RLS enablement and policy coverage per table.
 */
export function auditSchemaRlsPolicies(
  ddlSql: string,
  requiredTables: string[] = [
    'customers',
    'enquiries',
    'follow_ups',
    'appointments',
    'invoices',
    'payments',
  ]
): RlsAuditReport {
  const tables: Record<string, RlsTableAuditResult> = {};
  let compliantCount = 0;

  for (const table of requiredTables) {
    const rlsRegex = new RegExp(`ALTER\\s+TABLE\\s+${table}\\s+ENABLE\\s+ROW\\s+LEVEL\\s+SECURITY`, 'i');
    const rlsEnabled = rlsRegex.test(ddlSql);

    const selectRegex = new RegExp(`CREATE\\s+POLICY\\s+[^;]+ON\\s+${table}\\s+FOR\\s+SELECT`, 'i');
    const insertRegex = new RegExp(`CREATE\\s+POLICY\\s+[^;]+ON\\s+${table}\\s+FOR\\s+INSERT`, 'i');
    const updateRegex = new RegExp(`CREATE\\s+POLICY\\s+[^;]+ON\\s+${table}\\s+FOR\\s+UPDATE`, 'i');
    const deleteRegex = new RegExp(`CREATE\\s+POLICY\\s+[^;]+ON\\s+${table}\\s+FOR\\s+DELETE`, 'i');

    const hasSelectPolicy = selectRegex.test(ddlSql);
    const hasInsertPolicy = insertRegex.test(ddlSql);
    const hasUpdatePolicy = updateRegex.test(ddlSql);
    const hasDeletePolicy = deleteRegex.test(ddlSql);

    // Insecure bypass: USING (true) or WITH CHECK (true) on tenant tables
    const bypassRegex = new RegExp(`ON\\s+${table}[^;]+(USING\\s*\\(\\s*true\\s*\\)|WITH\\s+CHECK\\s*\\(\\s*true\\s*\\))`, 'i');
    const hasInsecureBypass = bypassRegex.test(ddlSql);

    const isAppendOnlyLedger = table === 'payments' || table === 'communication_logs' || table === 'ai_usage_logs';

    const warnings: string[] = [];
    if (!rlsEnabled) warnings.push('Row Level Security is NOT enabled.');
    if (!hasSelectPolicy) warnings.push('Missing SELECT policy.');
    if (!hasInsertPolicy) warnings.push('Missing INSERT policy.');
    if (!isAppendOnlyLedger && !hasUpdatePolicy) warnings.push('Missing UPDATE policy.');
    if (!isAppendOnlyLedger && !hasDeletePolicy) warnings.push('Missing DELETE policy.');
    if (hasInsecureBypass) warnings.push('Insecure open policy bypass detected (USING true).');

    const isCompliant =
      rlsEnabled &&
      hasSelectPolicy &&
      hasInsertPolicy &&
      (isAppendOnlyLedger || hasUpdatePolicy) &&
      !hasInsecureBypass;

    if (isCompliant) {
      compliantCount += 1;
    }

    tables[table] = {
      tableName: table,
      rlsEnabled,
      hasSelectPolicy,
      hasInsertPolicy,
      hasUpdatePolicy,
      hasDeletePolicy,
      hasInsecureBypass,
      isCompliant,
      warnings,
    };
  }

  return {
    compliantCount,
    totalAuditedTables: requiredTables.length,
    tables,
    allCompliant: compliantCount === requiredTables.length,
  };
}
