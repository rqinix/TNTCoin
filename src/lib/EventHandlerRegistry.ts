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

    /**
     * Registers an event handler for a specific event.
     * @param {string} event The event name.
     * @param {EventHandler<T>} handler The handler function.
     */
    public register(event: string, handler: EventHandler<T>): void {
        this.handlers.set(event, handler);
    }

    /**
     * Retrieves the handler for a specific event.
     * @param {string} event The event name.
     * @returns {EventHandler<T> | undefined} The handler function, or undefined if no handler is registered for the event.
     */
    public getHandler(event: string): EventHandler<T> | undefined {
        return this.handlers.get(event);
    }
}
