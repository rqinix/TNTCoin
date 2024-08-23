/**
 * Type definition for an event handler function.
 * @template T - The context type.
 */
export type EventHandler<T> = (context: T, message: any) => void;

/**
 * Class for managing event handlers.
 * @template T - The context type.
 */
export class EventHandlerRegistry<T> {
    private handlers: Map<string, EventHandler<T>> = new Map();
    private enabledEvents: Set<string> = new Set();

    /**
     * Registers an event handler for a specific event.
     * @param {string} event The event name.
     * @param {EventHandler<T>} handler The handler function.
     */
    public register(event: string, handler: EventHandler<T>): void {
        this.handlers.set(event, handler);
        this.enableEvent(event);
    }

    /**
     * Retrieves the handler for a specific event.
     * @param {string} event The event name.
     * @returns {EventHandler<T> | undefined} The handler function, or undefined if no handler is registered for the event.
     */
    public getHandler(event: string): EventHandler<T> | undefined {
        return this.handlers.get(event);
    }

    /**
     * Get all events.
     * @returns {string[]} The list of events.
     */
    public getAllEvents(): string[] {
        return Array.from(this.handlers.keys());
    }

    /**
     * Enables an event.
     * @param {string} event The event name.
     */
    public enableEvent(event: string): void {
        this.enabledEvents.add(event);
    }

    /**
     * Disables an event.
     * @param {string} event The event name.
     */
    public disableEvent(event: string): void {
        this.enabledEvents.delete(event);
    }

    /**
     * Checks if an event is enabled.
     * @param {string} event The event name.
     * @returns {boolean} `true` if the event is enabled, `false` otherwise.
     */
    public isEventEnabled(event: string): boolean {
        return this.enabledEvents.has(event);
    }
}
