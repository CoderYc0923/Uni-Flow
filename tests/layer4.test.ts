import { describe, it, expect } from 'vitest';
import { InMemorySharedState } from '../src/core/shared-state.js';

describe('SharedState', () => {
  it('supports scoped state', () => {
    const state = new InMemorySharedState();
    state.scope('session').set('user', 'alice');
    state.set('plan', ['step1']);

    expect(state.scope('session').get('user')).toBe('alice');
    expect(state.get('plan')).toEqual(['step1']);
    expect(state.scope('workflow').get('user')).toBeUndefined();
  });

  it('supports transactions', () => {
    const state = new InMemorySharedState();
    state.transaction((tx) => {
      tx.set('a', 1);
      tx.set('b', 2);
    });
    expect(state.get('a')).toBe(1);
    expect(state.get('b')).toBe(2);
  });
});

describe('MessageBus', () => {
  it('filters history by type', async () => {
    const { createMessageBus } = await import('../src/core/message-bus.js');
    const bus = createMessageBus();
    bus.publish({ type: 'steering', targetUnitId: 'a', content: 'hi', timestamp: 1 });
    bus.publish({ type: 'followup', targetUnitId: 'b', content: 'go', timestamp: 2 });

    const steering = bus.history({ type: 'steering' });
    expect(steering).toHaveLength(1);
    expect(steering[0]?.type).toBe('steering');
  });
});

describe('SecurityGovernance', () => {
  it('redacts PII in output', async () => {
    const { createSecurityGovernance } = await import('../src/layer4/security-governance.js');
    const security = createSecurityGovernance({
      allowedTools: ['read_file'],
      caller: { id: 'user1', roles: ['user'] },
    });

    const decision = security.preHook({
      caller: { id: 'user1', roles: ['user'] },
      unitId: 'test',
      tools: [{ name: 'read_file', description: 'read' }],
      input: { task: 'hello' },
      secrets: {},
    });
    expect(decision.action).toBe('allow');

    const { output, redacted } = security.postHook(
      {
        caller: { id: 'user1', roles: ['user'] },
        unitId: 'test',
        tools: [],
        input: { task: 'hello' },
        secrets: {},
      },
      { content: 'contact test@example.com', toolCalls: [], stopReason: 'stop', metadata: {} },
    );
    expect(redacted).toBe(true);
    expect(output.content).not.toContain('test@example.com');
  });
});
