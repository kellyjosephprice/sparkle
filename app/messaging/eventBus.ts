import type { EventHandler, GameEvent } from "./types";

class EventBus {
  private handlers: EventHandler[] = [];

  subscribe(handler: EventHandler): () => void {
    this.handlers.push(handler);

    // Return unsubscribe function
    return () => {
      this.handlers = this.handlers.filter(h => h !== handler);
    };
  }

  emit(event: GameEvent): void {
    this.handlers.forEach(handler => handler(event));
  }

  emitAll(events: GameEvent[]): void {
    events.forEach(event => this.emit(event));
  }
}

export const eventBus = new EventBus();
