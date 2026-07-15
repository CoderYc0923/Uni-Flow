import type { MessageBus, MessageFilter, MessageHandler, WorkflowMessage } from './types.js';

function matchesFilter(message: WorkflowMessage, filter: MessageFilter): boolean {
  if (filter.type !== undefined && message.type !== filter.type) return false;
  if (filter.since !== undefined && message.timestamp < filter.since) return false;
  if (filter.until !== undefined && message.timestamp > filter.until) return false;

  if ('sourceUnitId' in message && filter.sourceUnitId !== undefined) {
    if (message.sourceUnitId !== filter.sourceUnitId) return false;
  }
  if ('targetUnitId' in message && filter.targetUnitId !== undefined) {
    if (message.targetUnitId !== filter.targetUnitId) return false;
  }
  return true;
}

interface Subscription {
  filter: MessageFilter;
  handler: MessageHandler;
}

export class InMemoryMessageBus implements MessageBus {
  readonly deliveryGuarantee: 'at-least-once' | 'exactly-once';
  private messages: WorkflowMessage[] = [];
  private subscriptions: Subscription[] = [];
  private delivered = new Set<string>();

  constructor(deliveryGuarantee: 'at-least-once' | 'exactly-once' = 'at-least-once') {
    this.deliveryGuarantee = deliveryGuarantee;
  }

  publish(message: WorkflowMessage): void {
    this.messages.push(message);
    void this.dispatch(message);
  }

  async publishSync(message: WorkflowMessage): Promise<void> {
    this.messages.push(message);
    await this.dispatch(message);
  }

  subscribe(filter: MessageFilter, handler: MessageHandler): () => void {
    const sub: Subscription = { filter, handler };
    this.subscriptions.push(sub);
    return () => {
      const idx = this.subscriptions.indexOf(sub);
      if (idx >= 0) this.subscriptions.splice(idx, 1);
    };
  }

  history(filter?: MessageFilter): WorkflowMessage[] {
    if (!filter) return [...this.messages];
    return this.messages.filter((m) => matchesFilter(m, filter));
  }

  private async dispatch(message: WorkflowMessage): Promise<void> {
    const messageId = `${message.type}-${message.timestamp}-${JSON.stringify(message).slice(0, 64)}`;

    if (this.deliveryGuarantee === 'exactly-once' && this.delivered.has(messageId)) {
      return;
    }

    const handlers = this.subscriptions.filter((s) => matchesFilter(message, s.filter));
    await Promise.all(handlers.map((s) => Promise.resolve(s.handler(message))));

    if (this.deliveryGuarantee === 'exactly-once') {
      this.delivered.add(messageId);
    }
  }
}

export function createMessageBus(
  deliveryGuarantee: 'at-least-once' | 'exactly-once' = 'at-least-once',
): MessageBus {
  return new InMemoryMessageBus(deliveryGuarantee);
}
