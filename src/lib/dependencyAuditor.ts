/**
 * LocalFlow AI — Enterprise Dependency Vulnerability & License Compliance Auditor
 *
 * Scans runtime package manifests to detect high-severity security advisories,
 * deprecated package signatures, and restrictive copyleft licenses (GPL/AGPL)
 * that violate enterprise distribution policies.
 */

export type AdvisorySeverity = 'critical' | 'high' | 'medium' | 'low';

export interface SecurityAdvisory {
  packageName: string;
  vulnerableRange: string;
  severity: AdvisorySeverity;
  title: string;
  remediation: string;
}

export interface DependencyAuditReport {
  totalDependencies: number;
  vulnerabilities: Array<{
    package: string;
    version: string;
    advisory: SecurityAdvisory;
  }>;
  licenseIssues: Array<{
    package: string;
    license: string;
    reason: string;
  }>;
  isCompliant: boolean;
}

const PERMISSIVE_LICENSES = new Set([
  'mit',
  'apache-2.0',
  'bsd-2-clause',
  'bsd-3-clause',
  'isc',
  'unlicense',
  '0bsd',
]);

const RESTRICTIVE_LICENSES = new Set([
  'gpl-2.0',
  'gpl-3.0',
  'agpl-3.0',
  'lgpl-2.1',
  'lgpl-3.0',
]);

/**
 * Checks whether an open-source license string is commercial-friendly.
 */
export function checkLicenseCompliance(license?: string): {
  isPermissive: boolean;
  isRestricted: boolean;
  license: string;
} {
  if (!license || typeof license !== 'string') {
    return { isPermissive: false, isRestricted: false, license: 'UNKNOWN' };
  }

  const clean = license.trim().toLowerCase();

  return {
    isPermissive: PERMISSIVE_LICENSES.has(clean),
    isRestricted: RESTRICTIVE_LICENSES.has(clean),
    license: license.trim(),
  };
}

/**
 * Evaluates whether a semantic version string satisfies a vulnerable range condition.
 */
export function isVersionVulnerable(currentVersion: string, vulnerableRange: string): boolean {
  if (!currentVersion) return false;
  const cleanVersion = currentVersion.replace(/[\^~>=<]/g, '').trim();

  // Simple semver comparison for major.minor.patch
  const [cMajor = 0, cMinor = 0, cPatch = 0] = cleanVersion.split('.').map((n) => parseInt(n, 10));

  if (vulnerableRange.startsWith('<')) {
    const target = vulnerableRange.replace(/[<=\s]/g, '').trim();
    const [tMajor = 0, tMinor = 0, tPatch = 0] = target.split('.').map((n) => parseInt(n, 10));

    if (cMajor < tMajor) return true;
    if (cMajor === tMajor && cMinor < tMinor) return true;
    if (cMajor === tMajor && cMinor === tMinor && cPatch < tPatch) return true;
    return false;
  }

  return currentVersion === vulnerableRange;
}

/**
 * Audits dependency maps against security advisories and license restrictions.
 */
export function auditDependencies(
  dependencies: Record<string, string>,
  advisories: SecurityAdvisory[] = [],
  packageLicenses: Record<string, string> = {}
): DependencyAuditReport {
  const vulnerabilities: DependencyAuditReport['vulnerabilities'] = [];
  const licenseIssues: DependencyAuditReport['licenseIssues'] = [];

  const depEntries = Object.entries(dependencies || {});

  for (const [pkg, version] of depEntries) {
    // Check known advisories
    const matchingAdvisory = advisories.find((adv) => adv.packageName === pkg);
    if (matchingAdvisory && isVersionVulnerable(version, matchingAdvisory.vulnerableRange)) {
      vulnerabilities.push({
        package: pkg,
        version,
        advisory: matchingAdvisory,
      });
    }

    // Check license
    const lic = packageLicenses[pkg];
    if (lic) {
      const evaluation = checkLicenseCompliance(lic);
      if (evaluation.isRestricted) {
        licenseIssues.push({
          package: pkg,
          license: evaluation.license,
          reason: 'Copyleft license detected; forbidden in proprietary enterprise applications',
        });
      }
    }
  }

  return {
    totalDependencies: depEntries.length,
    vulnerabilities,
    licenseIssues,
    isCompliant: vulnerabilities.length === 0 && licenseIssues.length === 0,
  };
}
