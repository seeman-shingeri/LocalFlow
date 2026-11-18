import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

describe('Enterprise CI Automated Testing Workflow (ciWorkflow)', () => {
  const workflowPath = path.resolve(process.cwd(), '.github/workflows/ci.yml');

  it('verifies that .github/workflows/ci.yml exists and is non-empty', () => {
    expect(fs.existsSync(workflowPath)).toBe(true);
    const content = fs.readFileSync(workflowPath, 'utf-8');
    expect(content.length).toBeGreaterThan(50);
  });

  it('verifies CI triggers on push and pull_request to main branch', () => {
    const content = fs.readFileSync(workflowPath, 'utf-8');
    expect(content).toContain('branches: [main]');
    expect(content).toContain('pull_request:');
  });

  it('verifies CI pipeline contains typecheck, vitest tests, and production build steps', () => {
    const content = fs.readFileSync(workflowPath, 'utf-8');
    expect(content).toContain('npx tsc --noEmit');
    expect(content).toContain('npm test');
    expect(content).toContain('npm run build');
    expect(content).toContain('matrix:');
    expect(content).toContain('node-version: [18.x, 20.x]');
  });
});
