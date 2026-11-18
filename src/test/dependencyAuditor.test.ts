import { describe, it, expect } from 'vitest';
import {
  checkLicenseCompliance,
  isVersionVulnerable,
  auditDependencies,
  SecurityAdvisory,
} from '@/lib/dependencyAuditor';

describe('Enterprise Dependency Vulnerability & License Auditor (dependencyAuditor)', () => {
  it('correctly classifies permissive and copyleft licenses', () => {
    expect(checkLicenseCompliance('MIT').isPermissive).toBe(true);
    expect(checkLicenseCompliance('Apache-2.0').isPermissive).toBe(true);
    expect(checkLicenseCompliance('GPL-3.0').isRestricted).toBe(true);
    expect(checkLicenseCompliance('AGPL-3.0').isRestricted).toBe(true);
    expect(checkLicenseCompliance(undefined).isPermissive).toBe(false);
  });

  it('detects versions matching vulnerable range predicates', () => {
    expect(isVersionVulnerable('1.0.4', '< 2.0.0')).toBe(true);
    expect(isVersionVulnerable('2.1.0', '< 2.0.0')).toBe(false);
    expect(isVersionVulnerable('0.9.8', '< 1.0.0')).toBe(true);
  });

  it('runs complete audit report and flags both security vulnerabilities and copyleft licenses', () => {
    const deps = {
      react: '^18.3.1',
      lodash: '4.17.15',
      'risky-lib': '1.2.0',
    };

    const advisories: SecurityAdvisory[] = [
      {
        packageName: 'lodash',
        vulnerableRange: '< 4.17.21',
        severity: 'high',
        title: 'Prototype Pollution in lodash',
        remediation: 'Upgrade to lodash >= 4.17.21',
      },
    ];

    const licenses = {
      react: 'MIT',
      lodash: 'MIT',
      'risky-lib': 'AGPL-3.0',
    };

    const report = auditDependencies(deps, advisories, licenses);

    expect(report.totalDependencies).toBe(3);
    expect(report.isCompliant).toBe(false);

    expect(report.vulnerabilities).toHaveLength(1);
    expect(report.vulnerabilities[0].package).toBe('lodash');
    expect(report.vulnerabilities[0].advisory.severity).toBe('high');

    expect(report.licenseIssues).toHaveLength(1);
    expect(report.licenseIssues[0].package).toBe('risky-lib');
    expect(report.licenseIssues[0].license).toBe('AGPL-3.0');
  });

  it('reports compliance for a clean dependency tree', () => {
    const deps = {
      react: '18.3.1',
      'date-fns': '3.6.0',
    };

    const licenses = {
      react: 'MIT',
      'date-fns': 'MIT',
    };

    const report = auditDependencies(deps, [], licenses);
    expect(report.isCompliant).toBe(true);
    expect(report.vulnerabilities).toHaveLength(0);
    expect(report.licenseIssues).toHaveLength(0);
  });
});
