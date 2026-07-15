import { describe, it, expect } from 'vitest';
import { runSequentialPipeline } from '../examples/sequential-pipeline.js';

describe('examples/sequential-pipeline', () => {
  it('runs research then write', async () => {
    const result = await runSequentialPipeline('hello');
    expect(result.completedUnits).toEqual(['research', 'write']);
    expect(result.state['output.write']).toContain('written');
  });
});
