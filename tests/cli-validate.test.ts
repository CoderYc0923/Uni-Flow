import { describe, expect, it } from 'vitest';
import { spawnSync } from 'node:child_process';
import { join } from 'node:path';
import { existsSync } from 'node:fs';

const root = process.cwd();
const cliJs = join(root, 'dist', 'cli', 'uniflow.js');
const validYaml = join(root, 'examples', 'yaml-sequential.yaml');
const invalidYaml = join(root, 'examples', 'templates', '_invalid-for-cli-test.yaml');

describe('uniflow validate CLI', () => {
  it('exits 0 on valid workflow', () => {
    if (!existsSync(cliJs)) {
      const build = spawnSync('npm', ['run', 'build'], { cwd: root, encoding: 'utf8', shell: true });
      expect(build.status).toBe(0);
    }
    const result = spawnSync(process.execPath, [cliJs, 'validate', validYaml], {
      cwd: root,
      encoding: 'utf8',
    });
    expect(result.status).toBe(0);
    expect(result.stdout).toMatch(/OK:/);
  });

  it('exits non-zero on invalid workflow', () => {
    if (!existsSync(cliJs)) {
      const build = spawnSync('npm', ['run', 'build'], { cwd: root, encoding: 'utf8', shell: true });
      expect(build.status).toBe(0);
    }
    const result = spawnSync(process.execPath, [cliJs, 'validate', invalidYaml], {
      cwd: root,
      encoding: 'utf8',
    });
    expect(result.status).not.toBe(0);
    expect(result.stderr + result.stdout).toMatch(/FAIL:/);
  });
});
